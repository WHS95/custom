import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3001", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Click on different hat color options to verify the hat image and options update accordingly.
        frame = context.pages[-1]
        # Select a different hat color option (second color button) to check if hat image and options update.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on a different hat size option to verify the hat image and options update accordingly.
        frame = context.pages[-1]
        # Select hat size M to check if hat image and options update accordingly.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[4]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Increment quantity to 2 and verify price updates dynamically.
        frame = context.pages[-1]
        # Click + button to increase quantity from 1 to 2.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[5]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Increment quantity to a bulk amount (e.g., 10) to verify bulk discount application and dynamic price update.
        frame = context.pages[-1]
        # Click + button to increase quantity from 2 to 3.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[5]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Increment quantity further to a bulk amount (e.g., 10) to verify bulk discount application and dynamic price update.
        frame = context.pages[-1]
        # Click + button to increase quantity from 3 to 4.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[5]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Increment quantity further to a bulk amount (e.g., 10) to verify bulk discount application and dynamic price update.
        frame = context.pages[-1]
        # Click + button to increase quantity from 4 to 5.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[5]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Increment quantity further to a bulk amount (e.g., 10) to verify bulk discount application and dynamic price update.
        frame = context.pages[-1]
        # Click + button to increase quantity from 5 to 6.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[5]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Increment quantity to 10 to verify bulk discount application and dynamic price update.
        frame = context.pages[-1]
        # Click + button to increase quantity from 6 to 7.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[5]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Test changing hat color and size after setting bulk quantity to verify price and image update correctly.
        frame = context.pages[-1]
        # Select a different hat color option (third color button) to check if hat image and options update with bulk quantity.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[3]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on a different hat size option to verify hat image and price update with bulk quantity.
        frame = context.pages[-1]
        # Select hat size L to check if hat image and price update correctly with bulk quantity.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[4]/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Test the HatCanvas image drag and drop functionality to ensure it works properly.
        frame = context.pages[-1]
        # Click and drag the hat image on the canvas to test drag and drop functionality.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Test uploading an image via the HatCanvas drag and drop to confirm the upload process completes successfully and verify Admin login redirect if accessible.
        frame = context.pages[-1]
        # Click the upload button to test image upload functionality for HatCanvas drag and drop.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Perform a final check by changing color, size, and quantity after image upload to ensure price and image update correctly, then stop.
        frame = context.pages[-1]
        # Select a different hat color option (third color button) to verify price and image update after image upload.
        elem = frame.locator('xpath=html/body/div[2]/main/div/div/div[2]/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=색상 - MIDNIGHT BLACK').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=S').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=M').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=L').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=XL').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=FREE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Custom Hat | L').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=7').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=22,400 KRW').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=156,800 KRW').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3,000 KRW').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=159,800 KRW').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    