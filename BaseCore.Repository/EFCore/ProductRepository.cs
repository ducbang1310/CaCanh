using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Product Repository using Entity Framework Core
    /// </summary>
    public interface IProductRepositoryEF : IRepository<Product>
    {
        Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, int page, int pageSize, string? sortBy = null, decimal? maxPrice = null);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
        Task GetProducts();
    }

    public class ProductRepositoryEF : Repository<Product>, IProductRepositoryEF
    {
        public ProductRepositoryEF(MySqlDbContext context) : base(context)
        {
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, int page, int pageSize, string? sortBy = null, decimal? maxPrice = null)
        {
            var query = _dbSet.Include(p => p.Category).AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(keyword) ||
                    (p.Description != null && p.Description.ToLower().Contains(keyword)));
            }

            if (categoryId.HasValue && categoryId > 0)
            {
                query = query.Where(p => p.CategoryId == categoryId);
            }

            // Lọc giá trong SQL — TRƯỚC khi phân trang
            if (maxPrice.HasValue && maxPrice > 0)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            var totalCount = await query.CountAsync();

            // Sort TRƯỚC khi phân trang → đảm bảo trang 1 luôn đúng thứ tự
            query = sortBy switch
            {
                "price-asc"  => query.OrderBy(p => p.Price),
                "price-desc" => query.OrderByDescending(p => p.Price),
                "rating"     => query.OrderByDescending(p =>
                    _context.Reviews
                        .Where(r => r.ProductId == p.Id)
                        .Average(r => (double?)r.Rating) ?? 0),
                _ => query.OrderByDescending(p => p.Id)  // mặc định: mới nhất trước
            };

            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (products, totalCount);
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            return await _dbSet
                .Where(p => p.CategoryId == categoryId)
                .Include(p => p.Category)
                .ToListAsync();
        }

        public Task GetProducts()
        {
            throw new NotImplementedException();
        }
    }
}
