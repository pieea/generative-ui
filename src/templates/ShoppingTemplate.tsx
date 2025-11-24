'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

interface ProductMetadata {
  price?: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  freeShipping?: boolean;
  isNew?: boolean;
  isBest?: boolean;
}

export function ShoppingTemplate({ data, layout }: TemplateProps) {
  const columns = layout.columns || 4;

  const getProductMeta = (item: typeof data.items[0]): ProductMetadata => {
    const meta = item.metadata || {};
    return {
      price: typeof meta.price === 'number' ? meta.price : Math.floor(Math.random() * 1500000) + 100000,
      originalPrice: typeof meta.originalPrice === 'number' ? meta.originalPrice : undefined,
      discount: typeof meta.discount === 'number' ? meta.discount : undefined,
      rating: typeof meta.rating === 'number' ? meta.rating : 4 + Math.random(),
      reviewCount: typeof meta.reviewCount === 'number' ? meta.reviewCount : Math.floor(Math.random() * 5000) + 100,
      brand: typeof meta.brand === 'string' ? meta.brand : undefined,
      freeShipping: typeof meta.freeShipping === 'boolean' ? meta.freeShipping : Math.random() > 0.3,
      isNew: typeof meta.isNew === 'boolean' ? meta.isNew : Math.random() > 0.8,
      isBest: typeof meta.isBest === 'boolean' ? meta.isBest : Math.random() > 0.7,
    };
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <span className={styles.productStars}>
        {'★'.repeat(fullStars)}
        {hasHalf && '☆'}
        {'☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0))}
      </span>
    );
  };

  return (
    <div
      className={styles.shoppingContainer}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {data.items.map((item, index) => {
        const meta = getProductMeta(item);
        const hasDiscount = meta.discount && meta.discount > 0;

        return (
          <article key={item.id} className={styles.productCard}>
            {/* 배지 영역 */}
            <div className={styles.productBadges}>
              {hasDiscount && (
                <span className={styles.discountBadge}>-{meta.discount}%</span>
              )}
              {meta.isNew && (
                <span className={styles.newBadge}>NEW</span>
              )}
              {meta.isBest && (
                <span className={styles.bestBadge}>BEST</span>
              )}
            </div>

            {/* 상품 이미지 */}
            <div className={styles.productImage}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} />
              ) : (
                <div className={styles.productPlaceholder}>
                  <span>🛒</span>
                </div>
              )}
              {/* 찜하기 버튼 */}
              <button className={styles.wishlistButton} title="찜하기">
                ♡
              </button>
            </div>

            {/* 상품 정보 */}
            <div className={styles.productInfo}>
              {/* 브랜드 */}
              {meta.brand && (
                <span className={styles.productBrand}>{meta.brand}</span>
              )}

              {/* 상품명 */}
              <h3 className={styles.productName}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h3>

              {/* 가격 영역 */}
              <div className={styles.productPricing}>
                {hasDiscount && meta.originalPrice && (
                  <span className={styles.originalPrice}>
                    {formatPrice(meta.originalPrice)}원
                  </span>
                )}
                <div className={styles.currentPriceRow}>
                  {hasDiscount && (
                    <span className={styles.discountRate}>{meta.discount}%</span>
                  )}
                  <span className={styles.currentPrice}>
                    {formatPrice(meta.price!)}
                    <span className={styles.priceWon}>원</span>
                  </span>
                </div>
              </div>

              {/* 평점 & 리뷰 */}
              <div className={styles.productRating}>
                {renderStars(meta.rating!)}
                <span className={styles.ratingScore}>{meta.rating!.toFixed(1)}</span>
                <span className={styles.reviewCount}>({meta.reviewCount!.toLocaleString()})</span>
              </div>

              {/* 배송 정보 */}
              <div className={styles.productShipping}>
                {meta.freeShipping && (
                  <span className={styles.freeShippingTag}>
                    🚚 무료배송
                  </span>
                )}
              </div>

              {/* 태그 */}
              {item.tags && item.tags.length > 0 && (
                <div className={styles.productTags}>
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.productTag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className={styles.productActions}>
              <button className={styles.cartButton}>장바구니</button>
              <button className={styles.buyButton}>바로구매</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
