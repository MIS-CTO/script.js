#!/usr/bin/env python3
"""
Generate 120 HTML embed files for Webflow:
- 60 waitlist slot embeds (waitlist-slot-01.html to waitlist-slot-60.html)
- 60 upcoming slot embeds (upcoming-slot-01.html to upcoming-slot-60.html)
"""

import os

SUPABASE_URL = 'https://auxxyehgzkozdjylhqnx.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1eHh5ZWhnemtvemRqeWxocW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDczODgsImV4cCI6MjA3NjEyMzM4OH0.bg8NunF2qkps28Aj0ZqY35eKK--QOu8NduCkFyqp5KA'

def generate_waitlist_html(slot_num):
    """Generate HTML for a waitlist slot embed"""
    padded = f"{slot_num:02d}"
    return f'''<!-- WAITLIST SLOT {padded} - Standalone Webflow Embed -->
<style>
.wl-slot-{padded} * {{ margin: 0; padding: 0; box-sizing: border-box; }}
.wl-slot-{padded}-container {{ width: 100%; height: 50vh; position: relative; overflow: hidden; display: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
.wl-slot-{padded}-container.visible {{ display: block; }}
.wl-slot-{padded}-image-section {{ width: 100%; height: 35vh; position: relative; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
.wl-slot-{padded}-image {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
.wl-slot-{padded}-overlay {{ position: absolute; z-index: 10; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }}
.wl-slot-{padded}-style-overlay {{ top: 16px; left: 16px; }}
.wl-slot-{padded}-style-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; margin-bottom: 2px; }}
.wl-slot-{padded}-style-value {{ font-size: 13px; font-weight: 500; }}
.wl-slot-{padded}-instagram-overlay {{ top: 16px; right: 16px; }}
.wl-slot-{padded}-instagram-link {{ color: white; text-decoration: none; font-size: 13px; font-weight: 500; transition: opacity 0.2s ease; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }}
.wl-slot-{padded}-instagram-link:hover {{ opacity: 0.8; }}
.wl-slot-{padded}-text-section {{ width: 100%; height: 15vh; background: #f5f5f5; padding: 16px 20px; display: flex; flex-direction: column; justify-content: space-between; }}
.wl-slot-{padded}-header-row {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }}
.wl-slot-{padded}-artist-info {{ flex: 1; min-width: 0; }}
.wl-slot-{padded}-artist-name {{ font-size: 22px; font-weight: 700; color: #2d2d2d; line-height: 1.2; margin-bottom: 4px; }}
.wl-slot-{padded}-dates {{ font-size: 13px; font-weight: 500; color: #555; }}
.wl-slot-{padded}-book-button {{ background: #000; color: white; border: none; padding: 10px 20px; font-size: 12px; font-weight: 500; cursor: pointer; border-radius: 4px; transition: background 0.2s ease; white-space: nowrap; margin-left: 16px; flex-shrink: 0; }}
.wl-slot-{padded}-book-button:hover {{ background: #333; }}
.wl-slot-{padded}-bio {{ font-size: 12px; color: #555; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }}
.wl-slot-{padded}-state {{ width: 100%; height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9f9f9; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
.wl-slot-{padded}-state.hidden {{ display: none; }}
.wl-slot-{padded}-state-title {{ font-size: 18px; font-weight: 600; color: #2d2d2d; margin-bottom: 8px; }}
.wl-slot-{padded}-state-desc {{ font-size: 14px; color: #666; }}
@media (max-width: 768px) {{
  .wl-slot-{padded}-artist-name {{ font-size: 18px; }}
  .wl-slot-{padded}-dates {{ font-size: 12px; }}
  .wl-slot-{padded}-bio {{ font-size: 11px; }}
  .wl-slot-{padded}-book-button {{ padding: 8px 16px; font-size: 11px; }}
}}
</style>

<div id="wlState{padded}" class="wl-slot-{padded}-state">
  <div class="wl-slot-{padded}-state-title">Loading...</div>
  <div class="wl-slot-{padded}-state-desc">Fetching artist data...</div>
</div>

<div id="wlContainer{padded}" class="wl-slot-{padded}-container">
  <div class="wl-slot-{padded}-image-section">
    <img id="wlImage{padded}" class="wl-slot-{padded}-image" alt="Artist">
    <div class="wl-slot-{padded}-overlay wl-slot-{padded}-style-overlay">
      <div class="wl-slot-{padded}-style-label">Style</div>
      <div id="wlStyle{padded}" class="wl-slot-{padded}-style-value">—</div>
    </div>
    <div class="wl-slot-{padded}-overlay wl-slot-{padded}-instagram-overlay">
      <a id="wlInstagram{padded}" href="#" target="_blank" class="wl-slot-{padded}-instagram-link">@—</a>
    </div>
  </div>
  <div class="wl-slot-{padded}-text-section">
    <div class="wl-slot-{padded}-header-row">
      <div class="wl-slot-{padded}-artist-info">
        <div id="wlName{padded}" class="wl-slot-{padded}-artist-name">Artist Name</div>
        <div id="wlDates{padded}" class="wl-slot-{padded}-dates">Flexibel verfügbar</div>
      </div>
      <button id="wlButton{padded}" class="wl-slot-{padded}-book-button">Book now</button>
    </div>
    <div id="wlBio{padded}" class="wl-slot-{padded}-bio">Loading artist information...</div>
  </div>
</div>

<script>
(function() {{
  const SLOT = {slot_num};
  const ID = '{padded}';
  const SUPABASE_URL = '{SUPABASE_URL}';
  const SUPABASE_KEY = '{SUPABASE_KEY}';

  const stateEl = document.getElementById('wlState' + ID);
  const containerEl = document.getElementById('wlContainer' + ID);
  const imageEl = document.getElementById('wlImage' + ID);
  const styleEl = document.getElementById('wlStyle' + ID);
  const instagramEl = document.getElementById('wlInstagram' + ID);
  const nameEl = document.getElementById('wlName' + ID);
  const datesEl = document.getElementById('wlDates' + ID);
  const bioEl = document.getElementById('wlBio' + ID);
  const buttonEl = document.getElementById('wlButton' + ID);

  function truncate(text, max) {{
    if (!text) return '';
    return text.length <= max ? text : text.substring(0, max).trim() + '...';
  }}

  function showState(title, desc) {{
    stateEl.innerHTML = '<div class="wl-slot-' + ID + '-state-title">' + title + '</div><div class="wl-slot-' + ID + '-state-desc">' + desc + '</div>';
    stateEl.classList.remove('hidden');
    containerEl.classList.remove('visible');
  }}

  function showData(data) {{
    stateEl.classList.add('hidden');
    containerEl.classList.add('visible');

    const imgUrl = data.profile_picture_url || data.background_image_url;
    if (imgUrl) {{
      imageEl.src = imgUrl;
      imageEl.alt = data.artist_name || 'Artist';
      imageEl.onerror = function() {{ imageEl.style.display = 'none'; }};
    }} else {{
      imageEl.style.display = 'none';
    }}

    styleEl.textContent = data.style || 'Various Styles';

    if (data.instagram) {{
      const handle = data.instagram.startsWith('@') ? data.instagram : '@' + data.instagram;
      instagramEl.textContent = handle;
      instagramEl.href = 'https://instagram.com/' + data.instagram.replace('@', '');
    }} else {{
      instagramEl.textContent = '@—';
      instagramEl.href = '#';
      instagramEl.style.pointerEvents = 'none';
    }}

    nameEl.textContent = data.artist_name || 'Unknown Artist';
    datesEl.textContent = 'Flexibel verfügbar';
    bioEl.textContent = truncate(data.bio || data.short_description || 'No bio available', 120);

    buttonEl.onclick = function() {{
      if (data.instagram) {{
        window.open('https://instagram.com/' + data.instagram.replace('@', ''), '_blank');
      }}
    }};
  }}

  async function fetchData() {{
    showState('Loading Slot ' + SLOT + '...', 'Fetching artist data');

    const endpoint = SUPABASE_URL + '/rest/v1/waitlist_slots_ordered';
    const url = endpoint + '?display_order=eq.' + SLOT + '&select=display_order,artist_name,instagram,profile_picture_url,background_image_url,style,short_description,bio,is_guest';

    try {{
      const response = await fetch(url, {{
        method: 'GET',
        headers: {{
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json'
        }}
      }});

      if (!response.ok) throw new Error('HTTP ' + response.status);

      const data = await response.json();

      if (!data || data.length === 0) {{
        showState('Slot ' + SLOT, 'Currently inactive');
        return;
      }}

      showData(data[0]);
    }} catch (error) {{
      showState('Error', error.message || 'Failed to load');
    }}
  }}

  fetchData();
  setInterval(fetchData, 5 * 60 * 1000);
}})();
</script>'''


def generate_upcoming_html(slot_num):
    """Generate HTML for an upcoming slot embed"""
    padded = f"{slot_num:02d}"
    return f'''<!-- UPCOMING SLOT {padded} - Standalone Webflow Embed -->
<style>
.up-slot-{padded} * {{ margin: 0; padding: 0; box-sizing: border-box; }}
.up-slot-{padded}-container {{ width: 100%; height: 50vh; position: relative; overflow: hidden; display: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
.up-slot-{padded}-container.visible {{ display: block; }}
.up-slot-{padded}-image-section {{ width: 100%; height: 35vh; position: relative; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
.up-slot-{padded}-image {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
.up-slot-{padded}-overlay {{ position: absolute; z-index: 10; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }}
.up-slot-{padded}-style-overlay {{ top: 16px; left: 16px; }}
.up-slot-{padded}-style-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; margin-bottom: 2px; }}
.up-slot-{padded}-style-value {{ font-size: 13px; font-weight: 500; }}
.up-slot-{padded}-instagram-overlay {{ top: 16px; right: 16px; }}
.up-slot-{padded}-instagram-link {{ color: white; text-decoration: none; font-size: 13px; font-weight: 500; transition: opacity 0.2s ease; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }}
.up-slot-{padded}-instagram-link:hover {{ opacity: 0.8; }}
.up-slot-{padded}-text-section {{ width: 100%; height: 15vh; background: #f5f5f5; padding: 16px 20px; display: flex; flex-direction: column; justify-content: space-between; }}
.up-slot-{padded}-header-row {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }}
.up-slot-{padded}-artist-info {{ flex: 1; min-width: 0; }}
.up-slot-{padded}-artist-name {{ font-size: 22px; font-weight: 700; color: #2d2d2d; line-height: 1.2; margin-bottom: 4px; }}
.up-slot-{padded}-dates {{ font-size: 13px; font-weight: 500; color: #555; }}
.up-slot-{padded}-book-button {{ background: #000; color: white; border: none; padding: 10px 20px; font-size: 12px; font-weight: 500; cursor: pointer; border-radius: 4px; transition: background 0.2s ease; white-space: nowrap; margin-left: 16px; flex-shrink: 0; }}
.up-slot-{padded}-book-button:hover {{ background: #333; }}
.up-slot-{padded}-bio {{ font-size: 12px; color: #555; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }}
.up-slot-{padded}-state {{ width: 100%; height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9f9f9; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
.up-slot-{padded}-state.hidden {{ display: none; }}
.up-slot-{padded}-state-title {{ font-size: 18px; font-weight: 600; color: #2d2d2d; margin-bottom: 8px; }}
.up-slot-{padded}-state-desc {{ font-size: 14px; color: #666; }}
@media (max-width: 768px) {{
  .up-slot-{padded}-artist-name {{ font-size: 18px; }}
  .up-slot-{padded}-dates {{ font-size: 12px; }}
  .up-slot-{padded}-bio {{ font-size: 11px; }}
  .up-slot-{padded}-book-button {{ padding: 8px 16px; font-size: 11px; }}
}}
</style>

<div id="upState{padded}" class="up-slot-{padded}-state">
  <div class="up-slot-{padded}-state-title">Loading...</div>
  <div class="up-slot-{padded}-state-desc">Fetching artist data...</div>
</div>

<div id="upContainer{padded}" class="up-slot-{padded}-container">
  <div class="up-slot-{padded}-image-section">
    <img id="upImage{padded}" class="up-slot-{padded}-image" alt="Artist">
    <div class="up-slot-{padded}-overlay up-slot-{padded}-style-overlay">
      <div class="up-slot-{padded}-style-label">Style</div>
      <div id="upStyle{padded}" class="up-slot-{padded}-style-value">—</div>
    </div>
    <div class="up-slot-{padded}-overlay up-slot-{padded}-instagram-overlay">
      <a id="upInstagram{padded}" href="#" target="_blank" class="up-slot-{padded}-instagram-link">@—</a>
    </div>
  </div>
  <div class="up-slot-{padded}-text-section">
    <div class="up-slot-{padded}-header-row">
      <div class="up-slot-{padded}-artist-info">
        <div id="upName{padded}" class="up-slot-{padded}-artist-name">Artist Name</div>
        <div id="upDates{padded}" class="up-slot-{padded}-dates">—</div>
      </div>
      <button id="upButton{padded}" class="up-slot-{padded}-book-button">Book now</button>
    </div>
    <div id="upBio{padded}" class="up-slot-{padded}-bio">Loading artist information...</div>
  </div>
</div>

<script>
(function() {{
  const SLOT = {slot_num};
  const ID = '{padded}';
  const SUPABASE_URL = '{SUPABASE_URL}';
  const SUPABASE_KEY = '{SUPABASE_KEY}';

  const GERMAN_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  const stateEl = document.getElementById('upState' + ID);
  const containerEl = document.getElementById('upContainer' + ID);
  const imageEl = document.getElementById('upImage' + ID);
  const styleEl = document.getElementById('upStyle' + ID);
  const instagramEl = document.getElementById('upInstagram' + ID);
  const nameEl = document.getElementById('upName' + ID);
  const datesEl = document.getElementById('upDates' + ID);
  const bioEl = document.getElementById('upBio' + ID);
  const buttonEl = document.getElementById('upButton' + ID);

  function truncate(text, max) {{
    if (!text) return '';
    return text.length <= max ? text : text.substring(0, max).trim() + '...';
  }}

  function formatDate(dateStr) {{
    if (!dateStr) return '—';
    try {{
      const d = new Date(dateStr);
      return d.getDate() + '. ' + GERMAN_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }} catch (e) {{
      return '—';
    }}
  }}

  function showState(title, desc) {{
    stateEl.innerHTML = '<div class="up-slot-' + ID + '-state-title">' + title + '</div><div class="up-slot-' + ID + '-state-desc">' + desc + '</div>';
    stateEl.classList.remove('hidden');
    containerEl.classList.remove('visible');
  }}

  function showData(data) {{
    stateEl.classList.add('hidden');
    containerEl.classList.add('visible');

    const imgUrl = data.profile_picture_url || data.background_image_url;
    if (imgUrl) {{
      imageEl.src = imgUrl;
      imageEl.alt = data.artist_name || 'Artist';
      imageEl.onerror = function() {{ imageEl.style.display = 'none'; }};
    }} else {{
      imageEl.style.display = 'none';
    }}

    styleEl.textContent = data.style || 'Various Styles';

    if (data.instagram) {{
      const handle = data.instagram.startsWith('@') ? data.instagram : '@' + data.instagram;
      instagramEl.textContent = handle;
      instagramEl.href = 'https://instagram.com/' + data.instagram.replace('@', '');
    }} else {{
      instagramEl.textContent = '@—';
      instagramEl.href = '#';
      instagramEl.style.pointerEvents = 'none';
    }}

    nameEl.textContent = data.artist_name || 'Unknown Artist';
    datesEl.textContent = 'Anreise: ' + formatDate(data.date_from);
    bioEl.textContent = truncate(data.bio || data.short_description || 'No bio available', 120);

    buttonEl.onclick = function() {{
      if (data.instagram) {{
        window.open('https://instagram.com/' + data.instagram.replace('@', ''), '_blank');
      }}
    }};
  }}

  async function fetchData() {{
    showState('Loading Slot ' + SLOT + '...', 'Fetching artist data');

    const endpoint = SUPABASE_URL + '/rest/v1/upcoming_slots_ordered';
    const url = endpoint + '?display_order=eq.' + SLOT + '&select=display_order,date_from,date_to,artist_name,instagram,profile_picture_url,background_image_url,style,short_description,bio,is_guest';

    try {{
      const response = await fetch(url, {{
        method: 'GET',
        headers: {{
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json'
        }}
      }});

      if (!response.ok) throw new Error('HTTP ' + response.status);

      const data = await response.json();

      if (!data || data.length === 0) {{
        showState('Slot ' + SLOT, 'Currently inactive');
        return;
      }}

      showData(data[0]);
    }} catch (error) {{
      showState('Error', error.message || 'Failed to load');
    }}
  }}

  fetchData();
  setInterval(fetchData, 5 * 60 * 1000);
}})();
</script>'''


def main():
    waitlist_dir = '/mnt/user-data/outputs/waitlist'
    upcoming_dir = '/mnt/user-data/outputs/upcoming'

    os.makedirs(waitlist_dir, exist_ok=True)
    os.makedirs(upcoming_dir, exist_ok=True)

    # Generate 60 waitlist files
    print("Generating waitlist embed files...")
    for i in range(1, 61):
        filename = f"waitlist-slot-{i:02d}.html"
        filepath = os.path.join(waitlist_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(generate_waitlist_html(i))
        print(f"  Created: {filename}")

    # Generate 60 upcoming files
    print("\nGenerating upcoming embed files...")
    for i in range(1, 61):
        filename = f"upcoming-slot-{i:02d}.html"
        filepath = os.path.join(upcoming_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(generate_upcoming_html(i))
        print(f"  Created: {filename}")

    print("\n" + "="*50)
    print("GENERATION COMPLETE!")
    print("="*50)
    print(f"Waitlist files: {waitlist_dir}/ (60 files)")
    print(f"Upcoming files: {upcoming_dir}/ (60 files)")
    print(f"Total: 120 files")


if __name__ == '__main__':
    main()
