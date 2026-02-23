# Wiki Documentation Files

This directory contains wiki documentation for the Metronome Widget project.

## Contents

- **[Home.md](Home.md)** - Main wiki home page with overview and quick links
- **[Getting-Started.md](Getting-Started.md)** - Installation and setup instructions
- **[Features.md](Features.md)** - Complete feature list and descriptions
- **[Usage-Guide.md](Usage-Guide.md)** - Detailed usage instructions and tips
- **[Development.md](Development.md)** - Developer guide for contributors

## How to Use These Files

### Option 1: Upload to GitHub Wiki

These markdown files are ready to be uploaded to your GitHub wiki:

1. **Enable Wiki** in your repository:
   - Go to repository Settings
   - Scroll to Features section
   - Check "Wikis"

2. **Access the Wiki**:
   - Click the "Wiki" tab in your repository
   - Or visit: `https://github.com/DonElDoug/metronome-widget/wiki`

3. **Create Pages**:
   - Click "Create the first page" or "New Page"
   - Copy content from each `.md` file in this directory
   - Use the filename (without `.md`) as the page title:
     - `Home.md` → Create page titled "Home"
     - `Getting-Started.md` → Create page titled "Getting-Started"
     - etc.

4. **Set Sidebar** (optional):
   - Create a page called `_Sidebar`
   - Add navigation links to all wiki pages

### Option 2: Clone Wiki Repository

GitHub wikis are Git repositories themselves:

```bash
# Clone the wiki repository
git clone https://github.com/DonElDoug/metronome-widget.wiki.git

# Copy wiki files
cp wiki/*.md metronome-widget.wiki/

# Commit and push
cd metronome-widget.wiki
git add .
git commit -m "Add wiki documentation"
git push
```

### Option 3: Use as Regular Documentation

Alternatively, you can keep these files in the repository:

- They serve as in-repository documentation
- Users can browse them on GitHub
- Can be referenced in the README

## Customization

Feel free to modify these files to better match your project:

- Update any placeholder URLs or links
- Add specific version information
- Include screenshots or GIFs
- Add more sections as needed
- Update feature lists based on actual implementation

## File Structure

Each wiki page follows this structure:

- **Clear Title**: Descriptive H1 heading
- **Introduction**: Brief overview of the page content
- **Sections**: Organized with H2 and H3 headings
- **Examples**: Code blocks where applicable
- **Links**: Cross-references to other wiki pages

## Maintenance

Remember to update the wiki when:

- Adding new features
- Changing functionality
- Updating dependencies
- Fixing bugs that affect usage
- Receiving common user questions

## Contributing

If you want to improve the documentation:

1. Edit the files in this `wiki/` directory
2. Submit a pull request with your changes
3. Explain what documentation you've added or improved
