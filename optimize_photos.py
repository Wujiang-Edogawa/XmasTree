from PIL import Image
import os

def compress_images(directories=['src/assets/photos', 'public/photos'], max_size=(1024, 1024), quality=85):
    print("Starting photo optimization...")
    
    total_saved = 0
    
    for directory in directories:
        if not os.path.exists(directory):
            print(f"Directory not found: {directory}, skipping.")
            continue
            
        print(f"\nProcessing {directory}...")
        
        for filename in os.listdir(directory):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                filepath = os.path.join(directory, filename)
                try:
                    with Image.open(filepath) as img:
                        # Force loading to prevent "resource warning" or issues with overwriting
                        img.load()
                        
                        original_size = os.path.getsize(filepath)
                        original_mode = img.mode
                        
                        # Resize if needed
                        if img.width > max_size[0] or img.height > max_size[1]:
                            img.thumbnail(max_size, Image.Resampling.LANCZOS)
                        
                        # Save
                        # For JPG, we need RGB
                        if filename.lower().endswith(('.jpg', '.jpeg')) and img.mode != 'RGB':
                            img = img.convert('RGB')
                            
                        img.save(filepath, optimize=True, quality=quality)
                        
                        new_size = os.path.getsize(filepath)
                        saved = original_size - new_size
                        total_saved += saved
                        
                        if saved > 0:
                            print(f"✅ {filename}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB (Saved {saved/1024:.1f}KB)")
                        else:
                            print(f"➖ {filename}: No size reduction")
                            
                except Exception as e:
                    print(f"❌ Error processing {filename}: {e}")

    print(f"\nTotal space saved: {total_saved/1024/1024:.2f} MB")

if __name__ == "__main__":
    compress_images()
