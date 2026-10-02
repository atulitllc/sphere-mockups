/* Browser RTF → HTML for the Tracker preview. Covers the ODS-style subset used by the demo TLF samples. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SPHERE_RTF = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  var SKIP = {
    fonttbl: 1, colortbl: 1, stylesheet: 1, info: 1,
    header: 1, footer: 1, headerf: 1, footerf: 1, headerr: 1, footerr: 1, headerl: 1, footerl: 1,
    listtable: 1, listoverridetable: 1, revtbl: 1, xmlnstbl: 1, datastore: 1,
    themedata: 1, latentstyles: 1, colorschememapping: 1, generator: 1,
    object: 1, objdata: 1, fldinst: 1, nonshppict: 1, shprslt: 1, pictprops: 1
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hexToB64(hex) {
    hex = String(hex || '').replace(/[^0-9a-fA-F]/g, '');
    if (hex.length < 8) return '';
    if (hex.length % 2) hex = hex.slice(0, -1);
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    var bin = '';
    var chunk = 0x8000;
    for (var j = 0; j < bytes.length; j += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(j, j + chunk));
    }
    if (typeof btoa === 'function') return btoa(bin);
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    return '';
  }

  function rtfToHtml(src) {
    src = String(src || '');
    var i = 0;
    var stack = [{ skip: 0, bold: false, italic: false, ul: false, align: 'ql', pict: null, pictHex: '' }];
    function cur() { return stack[stack.length - 1]; }

    var blocks = [];
    var tableRows = [];
    var inRow = false;
    var cells = [];
    var cellParts = [];
    var para = [];

    function fmt(text) {
      var c = cur();
      var h = esc(text);
      if (!h) return '';
      if (c.bold) h = '<strong>' + h + '</strong>';
      if (c.italic) h = '<em>' + h + '</em>';
      if (c.ul) h = '<u>' + h + '</u>';
      return h;
    }
    function flushTable() {
      if (!tableRows.length) return;
      blocks.push('<table class="rtf-table"><tbody>' + tableRows.join('') + '</tbody></table>');
      tableRows = [];
    }
    function flushPara() {
      if (!para.length) return;
      var html = para.join('');
      para = [];
      if (!html.replace(/<br\s*\/?>/g, '').trim()) {
        if (inRow) cellParts.push('<br>');
        return;
      }
      var p = '<p class="rtf-p rtf-' + cur().align + '">' + html + '</p>';
      if (inRow) cellParts.push(p);
      else {
        flushTable();
        blocks.push(p);
      }
    }
    function pushText(t) {
      if (!t || cur().skip) return;
      if (cur().pict) {
        cur().pictHex += t.replace(/[^0-9a-fA-F]/g, '');
        return;
      }
      para.push(fmt(t));
    }
    function endCell() {
      flushPara();
      cells.push('<td class="rtf-' + cur().align + '">' + (cellParts.join('') || '&nbsp;') + '</td>');
      cellParts = [];
    }
    function endRow() {
      flushPara();
      if (cellParts.length) endCell();
      if (!cells.length) return;
      var cls = tableRows.length ? '' : ' class="rtf-head"';
      tableRows.push('<tr' + cls + '>' + cells.join('') + '</tr>');
      cells = [];
      inRow = false;
    }

    while (i < src.length) {
      var ch = src.charAt(i);
      if (ch === '{') {
        var parent = cur();
        stack.push({
          skip: parent.skip,
          bold: parent.bold,
          italic: parent.italic,
          ul: parent.ul,
          align: parent.align,
          pict: null,
          pictHex: ''
        });
        i++;
        continue;
      }
      if (ch === '}') {
        var leaving = stack.pop();
        if (leaving && leaving.pict && leaving.pictHex && !leaving.skip) {
          var mime = leaving.pict === 'jpeg' ? 'image/jpeg' : 'image/png';
          var b64 = hexToB64(leaving.pictHex);
          if (b64) {
            flushPara();
            var img = '<img class="rtf-pict" alt="Figure" src="data:' + mime + ';base64,' + b64 + '">';
            if (inRow) cellParts.push(img);
            else {
              flushTable();
              blocks.push(img);
            }
          }
        }
        if (!stack.length) {
          stack.push({ skip: 0, bold: false, italic: false, ul: false, align: 'ql', pict: null, pictHex: '' });
        }
        i++;
        continue;
      }
      if (ch === '\\') {
        var n1 = src.charAt(i + 1);
        if (n1 === '\\' || n1 === '{' || n1 === '}') {
          pushText(n1);
          i += 2;
          continue;
        }
        if (n1 === '\'') {
          pushText(String.fromCharCode(parseInt(src.substr(i + 2, 2), 16) || 0));
          i += 4;
          continue;
        }
        if (n1 === '*') {
          cur().skip = 1;
          i += 2;
          continue;
        }
        if (n1 === '\n' || n1 === '\r') {
          i += 2;
          continue;
        }
        if (n1 === '~') {
          pushText('\u00a0');
          i += 2;
          continue;
        }
        if (n1 === '-' || n1 === '_') {
          pushText('-');
          i += 2;
          continue;
        }
        var k = i + 1;
        while (k < src.length && /[a-zA-Z]/.test(src.charAt(k))) k++;
        var word = src.slice(i + 1, k);
        if (!word) { i++; continue; }
        var neg = false;
        if (src.charAt(k) === '-') { neg = true; k++; }
        var numStr = '';
        while (k < src.length && /[0-9]/.test(src.charAt(k))) { numStr += src.charAt(k); k++; }
        if (src.charAt(k) === ' ') k++;
        var hasNum = numStr.length > 0;
        var num = hasNum ? (neg ? -1 : 1) * parseInt(numStr, 10) : null;
        i = k;
        if (cur().skip && word !== 'pict') continue;
        if (SKIP[word]) { cur().skip = 1; continue; }
        if (word === 'pict') { cur().pict = 'png'; cur().pictHex = ''; continue; }
        if (cur().pict) {
          if (word === 'pngblip') cur().pict = 'png';
          else if (word === 'jpegblip') cur().pict = 'jpeg';
          continue;
        }
        if (word === 'u' && hasNum) {
          var cp = num < 0 ? num + 65536 : num;
          pushText(String.fromCharCode(cp));
          if (i < src.length && src.charAt(i) !== '\\' && src.charAt(i) !== '{' && src.charAt(i) !== '}' && src.charAt(i) !== '\n' && src.charAt(i) !== '\r') i++;
          continue;
        }
        if (word === 'par') { flushPara(); continue; }
        if (word === 'line') { para.push('<br>'); continue; }
        if (word === 'tab') { pushText('\u00a0\u00a0\u00a0\u00a0'); continue; }
        if (word === 'cell') { endCell(); continue; }
        if (word === 'row') { endRow(); continue; }
        if (word === 'trowd' || word === 'intbl') {
          if (!inRow) flushPara();
          inRow = true;
          continue;
        }
        if (word === 'pard') {
          flushPara();
          cur().align = 'ql';
          inRow = false;
          continue;
        }
        if (word === 'qc' || word === 'ql' || word === 'qr') { cur().align = word; continue; }
        if (word === 'b') { cur().bold = !(hasNum && num === 0); continue; }
        if (word === 'i') { cur().italic = !(hasNum && num === 0); continue; }
        if (word === 'ul') { cur().ul = !(hasNum && num === 0); continue; }
        if (word === 'ulnone') { cur().ul = false; continue; }
        continue;
      }
      if (ch === '\n' || ch === '\r') { i++; continue; }
      var j = i;
      while (j < src.length) {
        var cj = src.charAt(j);
        if (cj === '\\' || cj === '{' || cj === '}' || cj === '\n' || cj === '\r') break;
        j++;
      }
      pushText(src.slice(i, j));
      i = j;
    }
    flushPara();
    if (inRow && (cellParts.length || cells.length)) endRow();
    flushTable();
    return '<div class="rtf-doc">' + blocks.join('') + '</div>';
  }

  return { rtfToHtml: rtfToHtml };
});
