
# Read the original HTML and rebuild with all fixes properly applied
with open('symbol_manager.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("Creating fixed version with proper async handling...")

# Step 1: Replace allSymbols array with fetch code
all_symbols_start = html.find('const allSymbols = [')
if all_symbols_start > 0:
    # Find the end of the array
    bracket_count = 0
    in_array = False
    end_pos = -1
    
    for i in range(all_symbols_start, len(html)):
        char = html[i]
        if char == '[':
            bracket_count += 1
            in_array = True
        elif char == ']':
            bracket_count -= 1
            if in_array and bracket_count == 0:
                if i + 1 < len(html) and html[i + 1] == ';':
                    end_pos = i + 2
                else:
                    end_pos = i + 1
                break
    
    fetch_code = """let allSymbols = [];
let symbolsByCategory = {};

async function loadSymbolsFromJSON() {
    try {
        const response = await fetch('./symbols.json');
        if (!response.ok) throw new Error('Failed to load symbols');
        allSymbols = await response.json();
        
        symbolsByCategory = {};
        allSymbols.forEach(symbol => {
            const cat = symbol.cat || 'Other';
            if (!symbolsByCategory[cat]) {
                symbolsByCategory[cat] = [];
            }
            symbolsByCategory[cat].push(symbol);
        });
        
        console.log(`Loaded ${allSymbols.length} symbols in ${Object.keys(symbolsByCategory).length} categories`);
        return allSymbols;
    } catch (error) {
        console.error('Error loading symbols:', error);
        allSymbols = [{c:"©", n:"COPYRIGHT", cat:"Symbols"}];
        symbolsByCategory = {"Symbols": allSymbols};
        return allSymbols;
    }
}"""
    
    html = html[:all_symbols_start] + fetch_code + html[end_pos:]
    print("✓ Replaced allSymbols with async fetch")

print(f"HTML length: {len(html)}")
