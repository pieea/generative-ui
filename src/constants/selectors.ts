/**
 * CSS Selectors for Daum Search parsing
 */

export const SELECTORS = {
  // Common
  COMPONENT: '.g_comp',
  COMPONENT_TITLE: '.tit_comp, .tit_head, .tit_g, h3, h2',
  IMAGE: 'img',
  LINK: 'a',

  // News
  NEWS: {
    LIST: '.c-list-basic > li[data-docid]',
    TITLE: '.item-title .tit-g, .tit-g.clamp-g',
    TITLE_ALT: '.tit_news, .tit, a.link_txt',
    DESCRIPTION: '.conts-desc, .item-contents p',
    DESCRIPTION_ALT: '.desc, .txt_sub',
    URL: '.item-title a, .c-item-content a',
    IMAGE: '.item-thumb img',
    SOURCE: '.c-tit-doc .tit_item .txt_info, .c-tit-doc .tit_item, .info_news, .txt_cp',
    TIMESTAMP: '.gem-subinfo .txt_info',
    TIMESTAMP_ALT: '.txt_time, .date, .time',
  },

  // Shopping
  SHOPPING: {
    // 쇼핑하우 (SNP)
    SNP: {
      LIST: '.list_shopping > li, .item_shopping',
      TITLE: '.tit.clamp-g, .wrap_tit strong.tit',
      PRICE: '.item_price .txt_price, em.txt_price',
      IMAGE: '.wrap_thumb img',
      RATING: '.ico-rate',
      REVIEW: '.txt_subinfo',
      DELIVERY: '.txt_delivery .txt_price',
      LINK: 'a.thumb_bf, a.link_info',
    },
    // 네이버쇼핑 (NSJ, 0NS)
    NSJ: {
      LIST: 'li',
      CONTENT: '.c-item-content, .item_prd, .product_item',
      TITLE: '.tit-g.clamp-g, .tit_item, .tit_prd, .name',
      TITLE_ALT: '.item-title strong',
      PRICE: '.txt_price',
      IMAGE: 'img',
      MALL: '.txt_mallname, .txt_mall',
      DELIVERY: '.txt_delivery',
      REVIEW: '.cont_count .txt_info, .txt_review',
      LINK: 'a.wrap_cont, a.thumb_bf',
    },
  },

  // Exchange Rate
  EXCHANGE: {
    COLL: '#exchangeColl, [disp-attr="Z6T"]',
    ITEM: '.exchange_item, .rate_item, li, tr',
  },

  // Country Info
  COUNTRY: {
    TITLE: '.tit-g.clamp-g',
    TITLE_ALT: '.tit_head, .tit_comp, h2, h3',
    SUB_INFO: '.sub_header .txt-split, .conts-combo .txt-split',
    INFO_LIST: 'dl.conts-richx',
    LIVE_INFO: '.c-carousel .c-item-content',
    FLAG: '.badge_img img',
    DESCRIPTION: 'q-ellipsis span[slot="text"]',
    DESCRIPTION_ALT: '.wrap_desc',
    URL: '.c-tit-exact a',
  },

  // Events
  EVENTS: {
    COLL: '#tcsColl, [disp-attr="TCS"]',
    ITEM: '.c-item-content, .c-list-basic > li, .wrap_cont, li[data-docid], article',
    TITLE: '.tit-g.clamp-g, .item-title .tit-g, .tit_news, .tit',
    TITLE_ALT: 'a.link_txt, h3, h4, .txt_item',
    DESCRIPTION: '.conts-desc, .item-contents p, .desc, .txt_sub',
    DESCRIPTION_ALT: '.txt_info',
    LINK: '.item-title a, a.wrap_cont, a',
    IMAGE: 'img',
    TIMESTAMP: '.gem-subinfo .txt_info, .txt_date, .date, .time',
    LOCATION: '.txt_place, .place, .location, .txt_addr',
    SOURCE: '.c-tit-doc .tit_item, .info_news, .txt_cp, .txt_source',
    CATEGORY: '.txt_category, .tag, .badge',
  },

  // Person
  PERSON: {
    NAME: '.tit_info, .txt_name, .tit_item',
    IMAGE: 'img',
    DESCRIPTION: '.desc, .txt_info, .cont_info',
    INFO_LIST: '.list_info li, .info_item, .txt_cont',
    LINK: 'a',
  },

  // Locations
  LOCATION: {
    ITEM: '.wrap_cont, .item_place, .place_item, li',
    TITLE: '.tit_item, .name, .tit',
    ADDRESS: '.txt_addr, .addr, .address',
    CATEGORY: '.txt_category, .category',
    RATING: '.txt_grade, .rating, .star',
    LINK: 'a',
    IMAGE: 'img',
  },

  // Web
  WEB: {
    ITEM: '.wrap_cont, .item, li, article',
    TITLE: '.tit, .tit_item, a.link_txt, h3, h4',
    DESCRIPTION: '.desc, .txt_info, p',
    SOURCE: '.info, .source, .txt_cp',
    LINK: 'a',
    IMAGE: 'img',
  },
} as const;

/**
 * Image attributes for lazy loading support
 */
export const IMAGE_ATTRS = ['data-original-src', 'src'] as const;

/**
 * Selectors to exclude (related searches, ads, etc.)
 */
export const EXCLUDE_SELECTORS = {
  RELATED: '.tit_relate',
  RELATED_CLASS: 'relate',
} as const;
