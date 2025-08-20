# CSV Upload Guide

## Overview
The Backlink Price Finder supports flexible CSV uploads from various marketplaces. You can map any column names to the required fields.

## Marketplace/Vendor Information

**Two ways to specify marketplace information:**

### Method 1: Single Marketplace per CSV (Recommended)
- Specify the marketplace in the upload request
- All rows in the CSV belong to the same marketplace
- This is the typical use case for marketplace exports

### Method 2: Mixed Marketplaces in CSV (Advanced)
- Include a `marketplace` column in your CSV
- Each row can specify a different marketplace
- Useful for combined exports from multiple sources

## Required Fields
- **Domain**: The website domain (e.g., "example.com", "techcrunch.com")
- **Price**: The price amount (numeric value)

## Optional Fields
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") - defaults to "USD"
- **URL**: Listing URL for the offer
- **Content**: Whether content is included (true/false, 1/0) - defaults to false
- **Dofollow**: Whether link is dofollow (true/false, 1/0) - defaults to true

## Sample CSV Files

### 1. WhitePress Format
```csv
Domain,Price,Currency,URL,Includes Content,Dofollow
example.com,150.00,USD,https://whitepress.com/example-com,true,true
techcrunch.com,500.00,USD,https://whitepress.com/techcrunch-com,false,true
```

**Column Mapping:**
- Domain → `Domain`
- Price → `Price`
- Currency → `Currency`
- URL → `URL`
- Content → `Includes Content`
- Dofollow → `Dofollow`

### 2. Bazoom Format
```csv
website,price_euro,listing_link,has_content,is_dofollow
example.com,120.50,EUR,https://bazoom.com/example-com,1,1
techcrunch.com,450.00,EUR,https://bazoom.com/techcrunch-com,0,1
```

**Column Mapping:**
- Domain → `website`
- Price → `price_euro`
- Currency → (default: EUR)
- URL → `listing_link`
- Content → `has_content`
- Dofollow → `is_dofollow`

### 3. Minimal Format
```csv
domain,price
example.com,200.00
techcrunch.com,600.00
```

**Column Mapping:**
- Domain → `domain`
- Price → `price`
- Currency → (default: USD)
- URL → (not provided)
- Content → (default: false)
- Dofollow → (default: true)

### 4. Mixed Marketplaces Format
```csv
Domain,Price,Currency,Marketplace,URL,Includes Content,Dofollow
example.com,150.00,USD,WhitePress,https://whitepress.com/example-com,true,true
forbes.com,120.50,EUR,Bazoom,https://bazoom.com/forbes-com,true,true
wired.com,300.00,USD,Getfluence,https://getfluence.com/wired-com,false,true
```

**Column Mapping:**
- Domain → `Domain`
- Price → `Price`
- Currency → `Currency`
- Marketplace → `Marketplace`
- URL → `URL`
- Content → `Includes Content`
- Dofollow → `Dofollow`

## Upload Process

1. **Prepare your CSV file** with the required columns
2. **Upload via the web interface** at `/upload` or use the API endpoint
3. **Map your columns** to the required fields
4. **Set defaults** for missing optional fields
5. **Process and review** the results

## API Usage

### Endpoint
```
POST /api/v1/ingest/csv
```

### Request Format
```json
{
  "marketplace_name": "WhitePress",
  "marketplace_slug": "whitepress",
  "region": "Global",
  "column_mapping": {
    "domain_column": "Domain",
    "price_column": "Price",
    "currency_column": "Currency",
    "url_column": "URL",
    "content_column": "Includes Content",
    "dofollow_column": "Dofollow"
  },
  "currency_default": "USD",
  "content_default": false,
  "dofollow_default": true
}
```

## Tips

1. **Domain Format**: Domains are automatically normalized to eTLD+1 format
2. **Price Format**: Use numeric values (decimals supported)
3. **Currency**: Use standard 3-letter codes (USD, EUR, GBP, etc.)
4. **Boolean Fields**: Use true/false, 1/0, or yes/no
5. **Missing Data**: Optional fields can be omitted - defaults will be used

## Error Handling

The system will:
- Skip empty rows
- Report invalid domains
- Report invalid prices
- Continue processing even if some rows fail
- Provide a summary of successful vs failed imports

## Sample Files

Check the `sample_data/` directory for ready-to-use CSV files:
- `whitepress_sample.csv` - Full featured example (single marketplace)
- `bazoom_sample.csv` - Different column names (single marketplace)
- `getfluence_sample.csv` - Minimal format (single marketplace)
- `mixed_marketplaces_sample.csv` - Multiple marketplaces in one file
