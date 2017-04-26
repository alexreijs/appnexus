setwd('C:/Users/a.reijs/Repos/appnexus')

source('R/processFeed.R')

day <- '2017_04_25'
hour <- 7
rdsFileName = paste0('R/openDynamicAllocation-', day, '-', hour, '.rds')

if (!file.exists(rdsFileName)) {
  
  bidLandscapeFeed <- processFeed(feedName = 'bid_landscape_feed', day = day, hour = hour, columns = c('auction_id_64', 'brand_id',	 'actual_bid_price',	'biased_bid_price',	'bid_reject_reason', 'bidder_id',	'buyer_member_id',	'total_bid_modifier',	'exclusivity_level',	'ym_auction_tier_id',	'hard_floor',	'modified_hard_floor',	'soft_floor',	'modified_soft_floor',	'bid_payment_type',	'is_winning_bid',	'is_mediated_bid',	'raw_net_bid_price',	'external_request_id',	'bid_price_type'))
  standardFeed <- processFeed(feedName = 'standard_feed', day = day, hour = hour, columns = c('auction_id_64', 'is_exclusive' ,'deal_type', 'imp_type', 'revenue_type', 'campaign_id'))
  campaigns <- read.csv('data/services/campaign.csv')[, c("id", "priority", 'inventory_type', 'cpm_bid_type')]
  
  print('Merging data together ... ')
  ODA <- merge(bidLandscapeFeed, standardFeed, by = 'auction_id_64', all.x = T, all.y = F)
  ODA <- merge(ODA, campaigns, by.x = 'campaign_id', by.y = 'id', all.x = T, all.y = F)
  
  print('Saving data to disk ... ')
  saveRDS(ODA, rdsFileName)
  
} else {
  
  print('Reading data from disk ... ')
  ODA <- readRDS(rdsFileName)
  
}



RTB <- ODA[ODA$creative_id == 0, ]