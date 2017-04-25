library(dplyr)
library(readr)
library(jsonlite)

setwd('C:/Users/a.reijs/Repos/appnexus')

processFeed <- function (feedName, day) {
  colNames <- switch(feedName,
                     standard_feed = c('auction_id_64',	'datetime',	'user_tz_offset',	'width',	'height',	'media_type',	'fold_position',	'event_type',	'imp_type',	'payment_type',	'media_cost_dollars_cpm',	'revenue_type',	'buyer_spend',	'buyer-bid',	'ecp',	'eap',	'is_imp',	'is_learn',	'predict_type_rev',	'user_id_64',	'ip_address',	'ip_address_trunc',	'geo_country',	'geo_region',	'operating_system',	'browser',	'language',	'venue_id',	'seller_member_id',	'publisher_id',	'site_id',	'site_domain',	'tag_id',	'external_inv_id',	'reserve_price',	'seller_revenue_cpm',	'media_buy_rev_share_pct',	'pub_rule_id',	'seller_currency',	'publisher_currency',	'publisher_exchange_rate',	'serving_fees_cpm',	'serving_fees_revshare',	'buyer_member_id',	'advertiser_id',	'brand_id',	'advertiser_frequency',	'advertiser_recency',	'insertion_order_id',	'campaign_group_id',	'campaign_id',	'creative_id',	'creative_freq',	'creative_rec',	'cadence_modifier',	'can_convert',	'user_group_id',	'is_control',	'controller_pct',	'controller_creative_pct',	'is_click',	'pixel_id',	'is_remarketing',	'post_click_conv',	'post_view_conv',	'post_click_revenue',	'post_view_revenue',	'order_id',	'external_data',	'pricing_type',	'booked_revenue_dollars',	'booked_revenue_adv_curr',	'commission_cpm',	'commission_revshare',	'auction_service_deduction',	'auction_service_fees',	'creative_overage_fees',	'clear_fees',	'buyer_currency',	'advertiser_currency',	'advertiser_exchange_rate',	'latitude',	'longitude',	'device_unique_id',	'device_id',	'carrier_id',	'deal_id',	'view_result',	'application_id',	'supply_type',	'sdk_version',	'ozone_id',	'billing_period_id',	'view_non_measurable_reason',	'external_uid',	'request_uuid',	'geo_dma',	'geo_city',	'mobile_app_instance_id',	'traffic_source_code',	'external_request_id',	'deal_type',	'ym_floor_id',	'ym_bias_id',	'is_filtered_request',	'age',	'gender',	'is_exclusive',	'bid_priority',	'custom_model_id',	'custom_model_last_modified',	'leaf_name',	'data_costs_cpm'),
                     bid_landscape_feed = c('date_time',	'auction_id_64',	'user_id_64',	'brand_id',	'creative_id',	'actual_bid_price',	'biased_bid_price',	'bid_reject_reason',	'ym_floor_id',	'ym_bias_id',	'bidder_id',	'buyer_member_id',	'seller_member_id',	'total_bid_modifier',	'exclusivity_level',	'ym_auction_tier_id',	'hard_floor',	'modified_hard_floor',	'soft_floor',	'modified_soft_floor',	'bid_payment_type',	'is_winning_bid',	'deal_id',	'ad_profile_id',	'is_mediated_bid',	'raw_net_bid_price',	'external_request_id',	'bid_price_type'),
                     auction_category_feed = c('date_time',	'auction_id_64',	'user_id_64',	'seller_member_id', 'universal_categories', 'custom_categories')
  )

  path <- paste0('C:/Users/a.reijs/Repos/appnexus/data/feeds/', feedName, '/', day)
  files <- list.files(path = path, pattern = "\\.gz$")
  data <- data.frame()

  sapply(files, FUN = function(file) {
    tsv <-suppressMessages(suppressWarnings(read_tsv(paste0(path, '/', file), col_names = colNames, progress = F)))
    data <<- rbind.data.frame(data, tsv)
  })
  
  data
}

day <- '2017_04_20'
auctionCategoryFeed <- processFeed('auction_category_feed', day)
standardFeed <- processFeed('standard_feed', day)

merged <- merge(auctionCategoryFeed, standardFeed, by = 'auction_id_64', all.x = T, all.y = F)


