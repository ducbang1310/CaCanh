using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;

namespace BaseCore.APIService.Services
{
    /// <summary>
    /// Background job chạy mỗi 5 phút, tự động hủy đơn WaitingDeposit quá 24h
    /// và hoàn lại stock theo giới tính.
    /// </summary>
    public class AutoCancelOrderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutoCancelOrderService> _logger;

        public AutoCancelOrderService(IServiceProvider serviceProvider, ILogger<AutoCancelOrderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoCancelOrderService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CancelExpiredOrders();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in AutoCancelOrderService");
                }

                // Chờ 5 phút rồi quét lại
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        private async Task CancelExpiredOrders()
        {
            // Tạo scope mới vì BackgroundService là Singleton, còn DbContext là Scoped
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MySqlDbContext>();

            var cutoff = DateTime.UtcNow.AddHours(-24);

            var expiredOrders = await context.Orders
                .Where(o => o.Status == "WaitingDeposit" && o.OrderDate < cutoff)
                .ToListAsync();

            if (expiredOrders.Count == 0) return;

            _logger.LogInformation("Found {Count} expired orders to cancel.", expiredOrders.Count);

            foreach (var order in expiredOrders)
            {
                var details = await context.OrderDetails
                    .Where(d => d.OrderId == order.Id)
                    .ToListAsync();

                foreach (var detail in details)
                {
                    var product = await context.Products.FindAsync(detail.ProductId);
                    if (product == null) continue;

                    bool isGenderProduct = product.MaleStock > 0 || product.FemaleStock > 0
                        || !string.IsNullOrEmpty(detail.SelectedGender);

                    if (isGenderProduct)
                    {
                        switch (detail.SelectedGender)
                        {
                            case "Đực":
                                product.MaleStock += detail.Quantity;
                                break;
                            case "Cái":
                                product.FemaleStock += detail.Quantity;
                                break;
                            case "Cặp":
                                product.MaleStock += detail.Quantity;
                                product.FemaleStock += detail.Quantity;
                                break;
                        }
                        product.Stock = product.MaleStock + product.FemaleStock;
                    }
                    else
                    {
                        product.Stock += detail.Quantity;
                    }
                }

                order.Status = "Cancelled";
                _logger.LogInformation("Auto-cancelled order #{OrderId} (created {Date})", order.Id, order.OrderDate);
            }

            await context.SaveChangesAsync();
        }
    }
}
