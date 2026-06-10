using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.DTO.Common;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class OrderService : IOrderService
    {
        private readonly MySqlDbContext _context;
        private readonly ICartRepository _cartRepository;

        public OrderService(MySqlDbContext context, ICartRepository cartRepository)
        {
            _context = context;
            _cartRepository = cartRepository;
        }

        public async Task<Order> CreateOrderAsync(Order order)
        {
            order.OrderDate = DateTime.UtcNow;
            order.Status = "WaitingDeposit";
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<List<Order>> GetOrdersByUserIdAsync(string userId)
        {
            return await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<OrderResultDto> CheckoutAsync(string userId, string shippingAddress, string customerName = "", string customerPhone = "", decimal shippingFee = 0)
        {
            var cart = await _cartRepository.GetCartByUserId(userId);
            if (cart == null || !cart.Items.Any())
                throw new Exception("Giỏ hàng trống");

            // Serializable transaction: đảm bảo check và trừ stock là atomic,
            // tránh race condition khi nhiều request checkout cùng lúc
            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            try
            {
                decimal productTotal = 0;
                var orderDetails = new List<OrderDetail>();

                foreach (var item in cart.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                        throw new Exception($"Sản phẩm ID {item.ProductId} không tồn tại");

                    bool isGenderProduct = product.MaleStock > 0 || product.FemaleStock > 0;
                    decimal unitPrice;

                    if (isGenderProduct)
                    {
                        int available = item.SelectedGender switch
                        {
                            "Đực" => product.MaleStock,
                            "Cái" => product.FemaleStock,
                            "Cặp" => Math.Min(product.MaleStock, product.FemaleStock),
                            _ => product.MaleStock + product.FemaleStock
                        };
                        if (available < item.Quantity)
                            throw new Exception(
                                $"Sản phẩm '{product.Name}' ({item.SelectedGender}) chỉ còn {available} con trong kho, không đủ {item.Quantity} con");

                        unitPrice = item.SelectedGender == "Cặp"
                            ? (product.PairPrice ?? product.Price * 2)
                            : product.Price;

                        switch (item.SelectedGender)
                        {
                            case "Đực":
                                product.MaleStock -= item.Quantity;
                                break;
                            case "Cái":
                                product.FemaleStock -= item.Quantity;
                                break;
                            case "Cặp":
                                product.MaleStock -= item.Quantity;
                                product.FemaleStock -= item.Quantity;
                                break;
                        }
                        product.Stock = product.MaleStock + product.FemaleStock;
                    }
                    else
                    {
                        if (product.Stock < item.Quantity)
                            throw new Exception(
                                $"Sản phẩm '{product.Name}' chỉ còn {product.Stock} sản phẩm trong kho, không đủ {item.Quantity}");

                        unitPrice = product.Price;
                        product.Stock -= item.Quantity;
                    }

                    productTotal += unitPrice * item.Quantity;
                    orderDetails.Add(new OrderDetail
                    {
                        ProductId      = item.ProductId,
                        Quantity       = item.Quantity,
                        UnitPrice      = unitPrice,
                        SelectedGender = item.SelectedGender,
                    });
                }

                decimal totalAmount = productTotal + shippingFee;
                decimal depositAmount = Math.Round(totalAmount * 0.5m, 0);

                var order = new Order
                {
                    UserId = userId,
                    OrderDate = DateTime.UtcNow,
                    Status = "WaitingDeposit",
                    TotalAmount = totalAmount,
                    DepositAmount = depositAmount,
                    ShippingAddress = shippingAddress,
                    CustomerName = customerName,
                    CustomerPhone = customerPhone,
                };

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();

                foreach (var detail in orderDetails)
                {
                    detail.OrderId = order.Id;
                    await _context.Set<OrderDetail>().AddAsync(detail);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _cartRepository.ClearCart(cart.Id);

                return new OrderResultDto
                {
                    Id              = order.Id,
                    UserId          = order.UserId,
                    ShippingAddress = order.ShippingAddress,
                    CustomerName    = order.CustomerName,
                    CustomerPhone   = order.CustomerPhone,
                    TotalAmount     = totalAmount,
                    DepositAmount   = depositAmount,
                    Status          = order.Status,
                    DepositNote     = $"Vui lòng chuyển khoản {depositAmount:N0}đ (50% giá trị đơn) để xác nhận đơn hàng #{order.Id}. Đơn hàng sẽ bị huỷ tự động sau 24 giờ nếu chưa nhận được cọc."
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
