# EduTVET Backend - Complete Troubleshooting Guide

## ⚠️ Problem: "Failed to fetch" Error

This means the frontend cannot reach the backend server on port 5000.

## 🔧 Fix: Step-by-Step Server Startup

### Step 1: Open Command Prompt in Correct Location

**Windows:**
1. Press `Win + R`
2. Type: `cmd`
3. Click OK
4. Type: `cd C:\Users\edu\Desktop\edutvet-main\EDUTVETV1.1`
5. Verify you see: `C:\Users\edu\Desktop\edutvet-main\EDUTVETV1.1>`

**Or use start-server.bat:**
- Simply double-click: `EDUTVETV1.1\start-server.bat`
- It will automatically do everything below

### Step 2: Navigate to API Folder

```bash
cd api
```

You should see prompt change to: `...EDUTVETV1.1\api>`

### Step 3: Install Dependencies (First Time Only)

```bash
npm install
```

**Expected output:**
```
added X packages in X.XXs
```

**If it fails:**
- Make sure Node.js is installed: `node --version`
- Try again: `npm install`

### Step 4: Check if Port 5000 is Free

**Windows PowerShell (Run as Admin):**
```powershell
netstat -ano | findstr ":5000"
```

**If you see output like:**
```
  TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    1234
```
**Solution:** Something is using port 5000
- Find what's using it: `tasklist | findstr 1234`
- Kill it: `taskkill /PID 1234 /F`
- Or change port: See "Alternative Port" section below

**If NO output:** Port is free ✓

### Step 5: Start the Server

```bash
npm start
```

### ✅ Expected Success Output:

```
========================================
✅ Server running on port 5000
✅ Listening at http://localhost:5000
========================================
```

**The terminal should stay open and running.** Do NOT close it!

### Step 6: Test in Browser

Open browser and visit: **http://localhost:5000/upload.html**

Should load the upload page. If it does, ✅ **Server is working!**

---

## 🐛 Debugging if Server Won't Start

### Error: "Cannot find module"

**Problem:** Missing dependencies
**Solution:**
```bash
cd api
npm install --force
npm start
```

### Error: "EADDRINUSE: address already in use :::5000"

**Problem:** Port 5000 already in use
**Solution 1:** Kill existing process
```powershell
# PowerShell (Admin)
netstat -ano | findstr ":5000"
taskkill /PID [PIDNUMBER] /F
```

**Solution 2:** Use different port
```bash
set PORT=5001
npm start
# Then visit http://localhost:5001/upload.html
```

**Solution 3:** Wait a minute and try again
Sometimes port takes time to release after closing server

### Error: "Cannot find module 'pdf-parse' or 'mammoth'"

**Problem:** Optional dependencies not installed
**Solution:**
```bash
cd api
npm install pdf-parse mammoth tesseract.js --save
npm start
```

### Error: "path/server.js not found"

**Problem:** Wrong working directory
**Verify:**
```bash
# Should show: C:\Users\edu\Desktop\edutvet-main\EDUTVETV1.1\api
cd

# Should exist:
dir api\server.js

# If missing:
cd ..
dir api
```

### No errors but terminal closes immediately

**Problem:** Node.js not installed OR fatal error in server.js
**Verify:**
```bash
node --version
# If empty: Install Node.js from https://nodejs.org/
```

---

## 🧪 Testing Your Server

### Test 1: Health Check

While server is running, open NEW browser tab and visit:
```
http://localhost:5000/api/health
```

**Should see JSON:**
```json
{
  "status": "Server is running",
  "documentsCount": 2,
  "documentsFolder": "/path/to/documents"
}
```

✅ If you see this, server is working perfectly!

### Test 2: Check Static Files

Try these URLs:
- http://localhost:5000/upload.html (should load page)
- http://localhost:5000/documents.html (should load page)
- http://localhost:5000/admin.html (should load page)

If these load, ✅ static files are working!

### Test 3: Test Upload (Advanced)

Using a tool like Postman or curl:

```bash
curl -X POST http://localhost:5000/api/documents/upload -F "file=@test.pdf" -F "title=Test Doc" -F "department=Agriculture and Environmental studies" -F "level=Level 5" -F "docType=Notes" -F "description=Test"
```

Should return JSON with `"success": true`

---

## 🚀 Alternative Setup Methods

### Method 1: Use start-server.bat (Easiest for Windows)

Simply double-click: **EDUTVETV1.1\start-server.bat**

It will:
- Check if dependencies are installed
- Install if missing
- Create documents folder if missing
- Start the server
- Keep terminal open

### Method 2: Keep Terminal Open

When using command prompt, type at end:
```bash
npm start
pause
```

This keeps terminal open if server crashes.

### Method 3: Use Forever (Keeps Running if Crashes)

```bash
npm install -g forever
forever start api/server.js
```

To stop:
```bash
forever stop api/server.js
```

### Method 4: Use nodemon (Auto-restart on File Changes)

```bash
cd api
npm install --save-dev nodemon
npx nodemon server.js
```

---

## 📋 Checklist Before Uploading

Before you try to upload, verify:

- [ ] Terminal shows "Server running on port 5000"
- [ ] Terminal is still open (not closed)
- [ ] No errors in terminal output
- [ ] Browser can reach http://localhost:5000/api/health
- [ ] Browser shows JSON at health endpoint
- [ ] No other app using port 5000 (or using different port)

---

## 🔧 Quick Fixes to Try (In Order)

1. **Close all terminals** → Open fresh command prompt → Run `npm start` again
2. **Restart your computer** → Open command prompt → Run `npm start`
3. **Delete node_modules folder** → Run `npm install` → Run `npm start`
4. **Reinstall Node.js** → https://nodejs.org/ → Restart computer → Run `npm start`
5. **Check file permissions** → Right-click folder → Properties → Security tab → Full Control

---

## 📱 Common Scenarios

### "Failed to fetch" on upload.html

**Causes:** Server not running
**Check:**
```bash
# In terminal running the server, should see:
✅ Server running on port 5000
```

### Upload seems to work but no confirmation

**Possible:** Server is running but not responding
**Fix:**
- Restart server: Ctrl+C then `npm start`
- Check port: `netstat -ano | findstr 5000`

### Takes 10+ seconds to upload

**Possible:** Text extraction is slow (normal for large PDFs)
**Expected:** Up to 5 seconds for text extraction, then upload completes
**Fix:** Try smaller PDF first

### "Cannot POST /api/documents/upload"

**Cause:** Server is not at the right location OR route not configured
**Check:**
```bash
# In terminal with server running:
# Should see messages like:
[2026-02-09 12:00:00] POST /api/documents/upload
```

---

## 📞 Getting Help

If you still have issues, check:

1. **Browser Console** (F12) - See exact error message
2. **Terminal Output** - See if server logged any errors
3. **Network Tab** (F12 → Network) - Check what URL was called and response

Share this information:
- Full error message from browser console
- Full output from terminal where server is running
- What OS you're using (Windows, Mac, Linux)

---

## 💡 Pro Tips

**Tip 1:** Keep server terminal visible while testing
- Taskbar the upload page
- See errors in real-time in terminal

**Tip 2:** Use Ctrl+L in terminal to clear clutter
```bash
cls
# Show fresh terminal for easier reading
```

**Tip 3:** Test with another browser
- Sometimes browser cache causes issues
- Try: Firefox, Edge, Chrome, etc.

**Tip 4:** Open Developer Tools (F12)
- Console tab - see JavaScript errors
- Network tab - see HTTP requests/responses
- Helps debug frontend issues

**Tip 5:** Check Windows Defender isn't blocking Node.js
- Settings → Virus & threat protection
- Firewall exceptions
- Add node.exe to allowed apps

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Terminal shows "Server running on port 5000"
2. ✅ http://localhost:5000/api/health shows JSON
3. ✅ http://localhost:5000/upload.html loads the page
4. ✅ You can upload a file without errors
5. ✅ Document code appears (like EDU-26-XXXXX)
6. ✅ File appears in documents folder

---

## Next Steps After Server is Running

1. **Test Upload:**
   - Go to http://localhost:5000/upload.html
   - Select a small PDF (< 1MB)
   - Fill in the form
   - Click Upload
   - You should see a document code

2. **Test Documents Page:**
   - Go to http://localhost:5000/documents.html
   - Search by code or title
   - Download should work

3. **Test Admin Panel:**
   - Go to http://localhost:5000/admin.html
   - PIN: 1998
   - Go to Upload tab
   - Try uploading another document

---

**Still stuck? The issue is almost certainly that the server isn't running or port 5000 is blocked. Double-check the terminal shows "Server running on port 5000"!**
