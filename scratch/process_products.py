
import re

def parse_sheet(content):
    products = {}
    lines = content.split('\n')
    
    # regex to match lines with price (at the end)
    # Formats seen: 
    # 8/21/2025 Metronidazole Tabs 20 2000
    # Ampiclox Caps 10 2000
    # 12/21/2025 Burnox cream 1 4000
    
    for line in lines:
        line = line.strip()
        if not line: continue
        if any(h in line.upper() for h in ["DATE", "PRODUCT NAME", "QUANTITY", "AMMOUNT", "SELL PRICE"]): continue
        if line.startswith("---") or "___" in line: continue
        
        # Split by tabs or multiple spaces
        parts = re.split(r'\t+|\s{2,}', line)
        
        # If the first part is a date, ignore it for name extraction
        start_idx = 0
        if re.match(r'\d{1,2}[./]\s?\d{1,2}[./]\s?\d{4}', parts[0]):
            start_idx = 1
            
        if len(parts) - start_idx >= 2:
            name_candidate = parts[start_idx].strip()
            # The last part is usually the price
            price_str = parts[-1].strip().replace(',', '')
            
            # Clean name candidate (remove things in parentheses or extra notes)
            # e.g. "Skderm cream 1 (Mama Mona)" -> "Skderm cream"
            # e.g. "Amoxicillin C. 20 (Ma Mori dukani)" -> "Amoxicillin C."
            clean_name = re.split(r'\s\d+\s?\(', name_candidate)[0] # Split by " 1 ("
            clean_name = re.split(r'\s\d+\s', clean_name)[0] # Split by " 10 "
            clean_name = clean_name.strip()
            
            # Remove trailing numbers if any (like quantity)
            clean_name = re.sub(r'\s\d+$', '', clean_name).strip()
            
            if not clean_name or clean_name.lower() in ['n/a', 'na']: continue
            
            try:
                price = float(price_str)
                # Store the most recent price or just use it
                products[clean_name] = price
            except ValueError:
                continue
                
    return products

# I'll paste a representative sample of the content here to test, 
# or I can read it from the provided diff in the logic.
# Since I have the full content in the diff, I'll just write the full generator.

sql_template = "INSERT INTO products (name, category, base_price) VALUES\n"
values = []

# Mock content for the purpose of the script logic
# In the actual execution, I'll use the data from the diff.
