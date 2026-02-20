import os
import mammoth
from markdownify import markdownify as md

def convert_docx_to_md():
    success_count = 0
    error_count = 0

    # Walk through all directories and files
    for root, dirs, files in os.walk('.'):
        # Skip image folders already created to avoid redundant scans
        if "_images" in root:
            continue
            
        for file in files:
            # Check for .docx extension and ignore temporary files
            if file.endswith('.docx') and not file.startswith('~'):
                docx_path = os.path.join(root, file)
                print(f"Processing '{docx_path}'...")
                
                try:
                    # Create a directory for images specific to this document
                    base_name = os.path.splitext(file)[0]
                    
                    # If the name is generic, use the parent folder name to make it unique
                    if "document sans titre" in base_name.lower():
                        parent_folder = os.path.basename(root)
                        base_name = f"{parent_folder} - {base_name}"
                    
                    images_dir_name = f"{base_name}_images"
                    images_dir_path = os.path.join(root, images_dir_name)
                    
                    # Function to handle image conversion/storage
                    def convert_image(image):
                        if not os.path.exists(images_dir_path):
                            os.makedirs(images_dir_path)
                            
                        image_number = getattr(convert_image, "counter", 1)
                        setattr(convert_image, "counter", image_number + 1)
                        
                        with image.open() as image_bytes:
                            # Use content_type to determine extension
                            content_type = image.content_type or "image/png"
                            ext_parts = content_type.split("/")
                            file_extension = ext_parts[1] if len(ext_parts) > 1 else "png"
                            
                            image_filename = f"image_{image_number}.{file_extension}"
                            image_path = os.path.join(images_dir_path, image_filename)
                            
                            with open(image_path, "wb") as img_file:
                                img_file.write(image_bytes.read())
                            
                            return {"src": f"{images_dir_name}/{image_filename}"}

                    convert_image.counter = 1

                    # Define style mappings to suppress common warnings
                    style_map = """
                    p[style-name='TOC Heading'] => h1:fresh
                    p[style-name='First Paragraph'] => p:fresh
                    p[style-name='Body Text'] => p:fresh
                    p[style-name='Compact'] => p:fresh
                    p[style-name='Source Code'] => pre:fresh
                    r[style-name='Verbatim Char'] => code
                    """

                    with open(docx_path, "rb") as docx_file:
                        # Convert to HTML with image handler and style mapping
                        result = mammoth.convert_to_html(
                            docx_file, 
                            convert_image=mammoth.images.img_element(convert_image),
                            style_map=style_map
                        )
                        html = result.value
                        messages = result.messages
                        
                        # Filter out common warnings or present them cleaner
                        for message in messages:
                            # Suppress warnings for styles we already mapped
                            mapped_styles = ["TOC Heading", "Body Text", "First Paragraph", "Compact", "Source Code", "Verbatim Char"]
                            if message.type == "warning" and any(s in message.message for s in mapped_styles):
                                continue
                            print(f"  Warning: {message}")
                            
                        # Convert HTML to Markdown
                        markdown_text = md(html, heading_style="ATX")
                        
                        # Save Markdown file
                        output_filename = f"{base_name}.md"
                        output_path = os.path.join(root, output_filename)
                        
                        with open(output_path, "w", encoding="utf-8") as md_file:
                            md_file.write(markdown_text)
                            
                        print(f"  Successfully converted to '{output_filename}'")
                        if os.path.exists(images_dir_path):
                            print(f"  Images extracted to '{images_dir_name}/'")
                        
                        success_count += 1
                        
                except Exception as e:
                    print(f"  Error converting '{docx_path}': {str(e)}")
                    error_count += 1

    print(f"\nBatch conversion complete! Success: {success_count}, Errors: {error_count}")

if __name__ == "__main__":
    convert_docx_to_md()
