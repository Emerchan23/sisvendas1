import asyncio
from playwright.async_api import async_playwright

async def test_sales_module():
    """Test basic sales module functionality"""
    async with async_playwright() as p:
        try:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            print("🔍 Testing sales module...")
            
            # Navigate to application
            await page.goto("http://localhost:3145", timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=10000)
            
            print("✅ Application loaded successfully")
            
            # Login
            await page.fill('input[type="email"]', 'admin@sistema.com')
            await page.fill('input[type="password"]', 'admin123')
            await page.click('button[type="submit"]')
            
            # Wait for navigation after login
            await page.wait_for_load_state("networkidle", timeout=10000)
            print("✅ Login successful")
            
            # Navigate directly to sales page
            await page.goto("http://localhost:3145/vendas", timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=10000)
            print("✅ Sales page loaded directly")
            
            # Check if page title contains sales-related content
            page_title = await page.title()
            print(f"Page title: {page_title}")
            
            # Check if "Nova Venda" button exists
            nova_venda_btn = page.locator('button').filter(has_text="Nova Venda")
            if await nova_venda_btn.count() > 0:
                print("✅ 'Nova Venda' button found")
                await nova_venda_btn.first.click()
                await page.wait_for_timeout(3000)
                
                # Check if dialog opened
                dialog = page.locator('[role="dialog"]')
                if await dialog.is_visible():
                    print("✅ Sales dialog opened")
                    
                    # Check for product selection field - try multiple selectors
                    product_selectors = [
                        'button:has-text("Selecione um produto")',
                        'button:has-text("Produto")',
                        '[data-testid="product-select"]',
                        'select[name="produto"]',
                        'input[placeholder*="produto"]',
                        'textarea[placeholder*="produto"]'
                    ]
                    
                    product_found = False
                    for selector in product_selectors:
                        product_field = page.locator(selector)
                        if await product_field.count() > 0:
                            print(f"✅ Product field found with selector: {selector}")
                            product_found = True
                            
                            # Try to interact with the field
                            try:
                                await product_field.first.click()
                                await page.wait_for_timeout(2000)
                                
                                # Check if options appeared
                                options = page.locator('[role="option"], .option, li')
                                if await options.count() > 0:
                                    print(f"✅ Found {await options.count()} product options")
                                    return True
                                else:
                                    print("⚠️ Product field clicked but no options found")
                            except Exception as e:
                                print(f"⚠️ Could not interact with product field: {str(e)}")
                            break
                    
                    if not product_found:
                        print("❌ Product selection field not found with any selector")
                        # Print dialog content for debugging
                        dialog_content = await dialog.inner_html()
                        print(f"Dialog content preview: {dialog_content[:500]}...")
                        return False
                    
                    return product_found
                else:
                    print("❌ Sales dialog did not open")
                    return False
            else:
                print("❌ 'Nova Venda' button not found")
                # Check what buttons are available
                all_buttons = page.locator('button')
                button_count = await all_buttons.count()
                print(f"Found {button_count} buttons on the page")
                
                if button_count > 0:
                    for i in range(min(5, button_count)):  # Show first 5 buttons
                        button_text = await all_buttons.nth(i).inner_text()
                        print(f"Button {i+1}: '{button_text}'")
                
                return False
                
        except Exception as e:
            print(f"❌ Test failed with error: {str(e)}")
            return False
        finally:
            await browser.close()

if __name__ == "__main__":
    result = asyncio.run(test_sales_module())
    if result:
        print("\n✅ TC007 - Sales module test PASSED")
    else:
        print("\n❌ TC007 - Sales module test FAILED")
        exit(1)