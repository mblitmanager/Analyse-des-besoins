import os
import extract_msg
from markdownify import markdownify as md

def convert_msg_to_md():
    success_count = 0
    error_count = 0

    # Walk through all directories and files
    for root, dirs, files in os.walk('.'):
        for file in files:
            # Check for .msg extension
            if file.endswith('.msg'):
                msg_path = os.path.join(root, file)
                print(f"Processing '{msg_path}'...")
                
                try:
                    # Parse the .msg file
                    msg = extract_msg.Message(msg_path)
                    
                    # Extract metadata
                    subject = msg.subject or "No Subject"
                    sender = msg.sender or "Unknown Sender"
                    date = msg.date or "Unknown Date"
                    
                    # Extract body (prioritize HTML for better markdown conversion)
                    if msg.htmlBody:
                        body_html = msg.htmlBody
                        if isinstance(body_html, bytes):
                            body_html = body_html.decode('utf-8', errors='ignore')
                        content = md(body_html, heading_style="ATX")
                    else:
                        content = msg.body or ""

                    # Create Markdown content with metadata header
                    markdown_text = f"# {subject}\n\n"
                    markdown_text += f"**From:** {sender}\n"
                    markdown_text += f"**Date:** {date}\n\n"
                    markdown_text += "---\n\n"
                    markdown_text += content
                    
                    # Save Markdown file
                    base_name = os.path.splitext(file)[0]
                    output_filename = f"{base_name}.md"
                    output_path = os.path.join(root, output_filename)
                    
                    with open(output_path, "w", encoding="utf-8") as md_file:
                        md_file.write(markdown_text)
                        
                    print(f"  Successfully converted to '{output_filename}'")
                    success_count += 1
                    
                    # Close the message object to release the file handle
                    msg.close()
                        
                except Exception as e:
                    print(f"  Error converting '{msg_path}': {str(e)}")
                    error_count += 1

    print(f"\nBatch conversion complete! Success: {success_count}, Errors: {error_count}")

if __name__ == "__main__":
    convert_msg_to_md()
