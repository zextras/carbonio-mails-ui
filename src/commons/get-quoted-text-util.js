/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-empty */
/* eslint-disable no-cond-assign */
/* eslint-disable no-case-declarations */
/* eslint-disable consistent-return */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-plusplus */
import { orderBy } from 'lodash';

const contentType = 'text/html';

const _NON_WHITESPACE = /\S+/;

const TRIM_RE = /^\s+|\s+$/g;

const COMPRESS_RE = /\s+/g;

const ORIG_UNKNOWN = 'UNKNOWN';

const ORIG_QUOTED = 'QUOTED';

const ORIG_SEP_STRONG = 'SEP_STRONG';

const ORIG_WROTE_STRONG = 'WROTE_STRONG';

const ORIG_WROTE_WEAK = 'WROTE_WEAK';

const ORIG_HEADER = 'HEADER';

const ORIG_LINE = 'LINE';

const HTML_SEP_ID = 'zwchr';

const NOTES_SEPARATOR = '*~*~*~*~*~*~*~*~*~*';

// Regexes for finding stuff in msg content
const SIG_RE = /^(- ?-+)|(__+)\r?$/;

const SPLIT_RE = /\r\n|\r|\n/;

const HDR_RE = /^\s*\w+:/;

const COLON_RE = /\S+:$/;

// regexes for finding a delimiter such as "On DATE, NAME (EMAIL) wrote:"
const ORIG_EMAIL_RE = /[^@\s]+@[A-Za-z0-9-]{2,}(\.[A-Za-z0-9-]{2,})+/;

const ORIG_DATE_RE = /\d+\s*(\/|-|, )20\d\d/; // matches "03/07/2014" or "March 3, 2014" by looking for year 20xx

// eslint-disable-next-line no-useless-concat
const ORIG_INTRO_DE_RE = new RegExp('^(-{2,}|' + 'auf' + '\\s+)', 'i');
// eslint-disable-next-line no-useless-concat
const ORIG_INTRO_RE = new RegExp('^(-{2,}|' + 'on' + '\\s+)', 'i');

const MSG_SEP_RE = new RegExp(
	'\\s*--+\\s*(' +
		'Original Message' +
		'|' +
		'Originalnachricht' +
		'|' +
		'Weitergeleitete Nachricht' +
		'|' +
		'Forwarded Message' +
		'|' +
		'Original Appointment' +
		')\\s*--+\\s*',
	'i'
);

const MSG_ORIGINAL_RE = new RegExp(
	'\\s*--+\\s*(' +
		'Original Message' +
		'|' +
		'Originalnachricht' +
		'|' +
		'Original Appointment' +
		')\\s*--+\\s*',
	'i'
);

const MSG_FORWARD_RE = new RegExp(
	// eslint-disable-next-line no-useless-concat
	'\\s*--+\\s*(' + 'Weitergeleitete Nachricht' + '|' + 'Forwarded Message' + ')\\s*--+\\s*',
	'i'
);

const IMG_SRC_CID_REGEX = /<img([^>]*)\ssrc=["']cid:/gi;

const MSG_REGEXES = [
	{
		type: ORIG_QUOTED,
		// regex: /^\s*(>|\|)/
		regex: /^[>|].*/
	},
	{
		type: ORIG_SEP_STRONG,
		regex: new RegExp(
			'^\\s*--+\\s*(' +
				'Original Message' +
				'|' +
				'Originalnachricht' +
				'|' +
				'Weitergeleitete Nachricht' +
				'|' +
				'Forwarded Message' +
				'|' +
				'Original Appointment' +
				')\\s*--+\\s*$',
			'i'
		)
	},
	{
		type: ORIG_SEP_STRONG,
		// eslint-disable-next-line no-useless-concat
		regex: new RegExp('^' + 'Begin forwarded message:' + '$', 'i')
	},
	{
		type: ORIG_HEADER,
		regex: new RegExp(`^\\s*(${['from:', 'to:', 'subject:', 'date:', 'sent:', 'cc:'].join('|')}).*`)
	},
	{
		type: ORIG_LINE,
		regex: /^\\s*_{5,}\\s*$/
	}
];

const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

const IGNORE_NODE = { '#comment': true, br: true, script: true, select: true, style: true };

const _flatten = (node, list) => {
	const nodeName = node && node.nodeName.toLowerCase();
	if (IGNORE_NODE[nodeName]) {
		return;
	}
	list.push(node);
	const children = node.childNodes || [];
	for (let i = 0; i < children.length; i++) {
		_flatten(children[i], list);
	}
};

export function _checkNodeContent(node) {
	const content = node.textContent || '';
	if (!_NON_WHITESPACE.test(content) || content.length > 200) {
		return null;
	}

	const type = _getLineType(content);
	return type === ORIG_SEP_STRONG || type === ORIG_WROTE_STRONG ? type : null;
}

export function _checkNode(el) {
	if (!el) {
		return null;
	}
	const nodeName = el.nodeName.toLowerCase();
	let type = null;
	if (nodeName === '#text') {
		const content = trim(el.nodeValue);
		if (_NON_WHITESPACE.test(content)) {
			type = _getLineType(content);
		}
	} else if (nodeName === 'hr') {
		if (
			el.id === HTML_SEP_ID ||
			(el.size === '2' && el.width === '100%' && el.align === 'center')
		) {
			type = ORIG_SEP_STRONG;
		} else {
			type = ORIG_LINE;
		}
	} else if (nodeName === 'pre') {
		type = _checkNodeContent(el);
	} else if (nodeName === 'div') {
		if (el.className === 'OutlookMessageHeader' || el.className === 'gmail_quote') {
			type = ORIG_SEP_STRONG;
		}
		type = type || _checkNodeContent(el);
	} else if (nodeName === 'span') {
		type = type || _checkNodeContent(el);
	} else if (nodeName === 'img') {
		type = ORIG_UNKNOWN;
	} else if (nodeName === 'blockquote') {
		type = ORIG_QUOTED;
	}
	return type;
}

export function _prune(node, clipNode) {
	const p = node && node.parentNode;
	while (p && p.lastChild && p.lastChild !== node) {
		p.removeChild(p.lastChild);
	}
	if (clipNode && p && p.lastChild === node) {
		p.removeChild(p.lastChild);
	}
	const nodeName = p && p.nodeName.toLowerCase();
	if (p && nodeName !== 'body' && nodeName !== 'html') {
		_prune(p, false);
	}
}

export function trim(str, compress, space) {
	if (!str) {
		return '';
	}
	let trimRe = TRIM_RE;
	let compressRe = COMPRESS_RE;
	if (space) {
		trimRe = new RegExp(`^${space}+|${space}+$`, 'g');
		compressRe = new RegExp(`${space}+`, 'g');
	} else {
		// eslint-disable-next-line no-param-reassign
		space = ' ';
	}
	str = str.replace(trimRe, '');
	if (compress) {
		str = str.replace(compressRe, space);
	}
	return str;
}

export function _getLineType(testLine) {
	let type = ORIG_UNKNOWN;
	for (let j = 0; j < MSG_REGEXES.length; j++) {
		const msgTest = MSG_REGEXES[j];
		const { regex } = msgTest;
		if (msgTest.type !== ORIG_HEADER) {
			if (regex.test(testLine.toLowerCase())) {
				if (msgTest.type === ORIG_QUOTED && /^\s*\|.*\|\s*$/.test(testLine)) {
					// eslint-disable-next-line no-continue
					continue;
				}
				type = msgTest.type;
				break;
			}
		}
	}
	if (type === ORIG_UNKNOWN) {
		const m = testLine.match(/(\w+):$/);
		const verb = m && m[1] && m[1].toLowerCase();
		if (verb) {
			let points = 0;
			// eslint-disable-next-line no-nested-ternary
			points = points ? 5 : verb === 'changed' ? 0 : 2;
			if (ORIG_EMAIL_RE.test(testLine)) {
				points += 4;
			}
			if (ORIG_DATE_RE.test(testLine)) {
				points += 3;
			}
			if (points >= 7) {
				type = ORIG_WROTE_STRONG;
			}
			if (points >= 5) {
				type = ORIG_WROTE_WEAK;
			}
		}
	}
	return type;
}

const DOC_TAG_REGEX = /<\/?(html|head|body)>/gi;

export function trimHtml(html) {
	if (!html) {
		return '';
	}
	let trimmedHtml = html;

	// remove doc-level tags if they don't have attributes
	trimmedHtml = trimmedHtml.replace(DOC_TAG_REGEX, '');

	// some editors like to put every <br> in a <div>
	trimmedHtml = trimmedHtml.replace(/<div><br ?\/?><\/div>/gi, '<br>');

	// remove leading/trailing <br>
	let len = 0;
	while (
		trimmedHtml.length !== len &&
		(/^<br ?\/?>/i.test(trimmedHtml) || /<br ?\/?>$/i.test(trimmedHtml))
	) {
		len = trimmedHtml.length; // loop prevention
		trimmedHtml = trimmedHtml.replace(/^<br ?\/?>/i, '').replace(/<br ?\/?>$/i, '');
	}

	// remove trailing <br> trapped in front of closing tags
	const m = trimmedHtml && trimmedHtml.match(/((<br ?\/?>)+)((<\/\w+>)+)$/i);
	if (m && m.length) {
		const regex = new RegExp(`${m[1] + m[3]}$`, 'i');
		trimmedHtml = trimmedHtml.replace(regex, m[3]);
	}

	// remove empty internal <div> containers
	trimmedHtml = trimmedHtml.replace(/(<div><\/div>)+/gi, '');

	return trim(trimmedHtml);
}

export function getQuoteOnly(lines, index) {
	const results = lines.splice(index, lines.length - 1);
	return results.join('\r\n');
}

export function getBodyOnly(lines, index) {
	const results = lines.splice(0, index);
	return results.join('\r\n');
}

export function getOriginalContent(text, isHtml) {
	if (!text) {
		return '';
	}
	if (isHtml) {
		return _getOriginalHtmlContent(text);
	}

	const results = [];
	const lines = text.split(SPLIT_RE);

	let curType;
	let curBlock = [];
	const count = {};
	let isMerged;
	let unknownBlock;
	let isBugzilla = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		let testLine = trim(line);

		// blank lines are just added to the current block
		if (!_NON_WHITESPACE.test(testLine)) {
			curBlock.push(line);
			continue;
		}

		// Bugzilla summary looks like QUOTED; it should be treated as UNKNOWN
		if (testLine.indexOf('| DO NOT REPLY') === 0 && lines[i + 2].indexOf('bugzilla') !== -1) {
			isBugzilla = true;
		}

		let type = _getLineType(testLine);
		if (type === ORIG_QUOTED) {
			type = isBugzilla ? ORIG_UNKNOWN : type;
		} else {
			isBugzilla = false;
		}

		// WROTE can stretch over two lines; if so, join them into one line
		let nextLine = lines[i + 1];
		isMerged = false;

		// if (nextLine && (type === ORIG_UNKNOWN) && (ORIG_INTRO_RE.test(testLine) || ORIG_INTRO_DE_RE.test(testLine))) {
		//     return getBodyOnly(lines, i);
		// }

		if (
			nextLine &&
			type === ORIG_UNKNOWN &&
			(ORIG_INTRO_RE.test(testLine) || ORIG_INTRO_DE_RE.test(testLine)) &&
			nextLine.match(/\w+:$/)
		) {
			testLine = [testLine, nextLine].join(' ');
			type = _getLineType(testLine);
			isMerged = true;
		}

		// LINE sometimes used as delimiter; if HEADER follows, lump it in with them
		if (type === ORIG_LINE) {
			let j = i + 1;
			nextLine = lines[j];
			while (!_NON_WHITESPACE.test(nextLine) && j < lines.length) {
				nextLine = lines[++j];
			}
			const nextType = nextLine && _getLineType(nextLine);
			if (nextType === ORIG_HEADER) {
				type = ORIG_HEADER;
			} else {
				type = ORIG_UNKNOWN;
			}
		}

		// see if we're switching to a new type; if so, package up what we have so far
		if (curType) {
			if (curType !== type) {
				results.push({ type: curType, block: curBlock });
				unknownBlock = curType === ORIG_UNKNOWN ? curBlock : unknownBlock;
				count[curType] = count[curType] ? count[curType] + 1 : 1;
				curBlock = [];
				curType = type;
			}
		} else {
			curType = type;
		}

		if (isMerged && (type === ORIG_WROTE_WEAK || type === ORIG_WROTE_STRONG)) {
			curBlock.push(line);
			curBlock.push(nextLine);
			i++;
			isMerged = false;
		} else {
			curBlock.push(line);
		}
	}

	// Handle remaining content
	if (curBlock.length) {
		results.push({ type: curType, block: curBlock });
		unknownBlock = curType === ORIG_UNKNOWN ? curBlock : unknownBlock;
		count[curType] = count[curType] ? count[curType] + 1 : 1;
	}

	// Now it's time to analyze all these blocks that we've classified

	// Check for UNKNOWN followed by HEADER
	const first = results[0];
	const second = results[1];
	if (
		first &&
		first.type === ORIG_UNKNOWN &&
		second &&
		(second.type === ORIG_HEADER || second.type === ORIG_WROTE_STRONG)
	) {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const originalText = _getTextFromBlock(first.block);
		if (originalText) {
			const third = results[2];
			if (third && third.type === ORIG_UNKNOWN) {
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
				const originalThirdText = _getTextFromBlock(third.block);
				if (originalThirdText && originalThirdText.indexOf(NOTES_SEPARATOR) !== -1) {
					return originalText + originalThirdText;
				}
			}
			return originalText;
		}
	}

	// check for special case of WROTE preceded by UNKNOWN, followed by mix of UNKNOWN and QUOTED (inline reply)
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	let originalText = _checkInlineWrote(count, results);
	if (originalText) {
		return originalText;
	}

	// If we found quoted content and there's exactly one UNKNOWN block, return it.
	if (count[ORIG_UNKNOWN] === 1 && count[ORIG_QUOTED] > 0) {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		originalText = _getTextFromBlock(unknownBlock);
		if (originalText) {
			return originalText;
		}
	}

	// If we have a STRONG separator (eg "--- Original Message ---"), consider it authoritative and return the text that precedes it
	if (count[ORIG_SEP_STRONG] > 0) {
		let block = [];
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			if (result.type === ORIG_SEP_STRONG) {
				break;
			}
			block = block.concat(result.block);
		}
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		originalText = _getTextFromBlock(block);
		if (originalText) {
			return originalText;
		}
	}

	return text;
}

export function _checkInlineWrote(count, results) {
	if (count[ORIG_WROTE_STRONG] > 0) {
		let unknownBlock;
		let foundSep = false;
		const afterSep = {};
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			const { type } = result;
			if (type === ORIG_WROTE_STRONG) {
				foundSep = true;
			} else if (type === ORIG_UNKNOWN && !foundSep) {
				if (unknownBlock) {
					return null;
				}

				unknownBlock = result.block;
			} else if (foundSep) {
				afterSep[type] = true;
			}
		}

		const mixed = afterSep[ORIG_UNKNOWN] && afterSep[ORIG_QUOTED];
		const endsWithUnknown =
			count[ORIG_UNKNOWN] === 2 && results[results.length - 1].type === ORIG_UNKNOWN;
		if (unknownBlock && (!mixed || endsWithUnknown)) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			const originalText = _getTextFromBlock(unknownBlock);
			if (originalText) {
				return originalText;
			}
		}
	}
}

export function _getTextFromBlock(block) {
	if (!(block && block.length)) {
		return null;
	}
	let originalText = `${block.join('\n')}\n`;
	originalText = originalText.replace(/\s+$/, '\n');
	return _NON_WHITESPACE.test(originalText) ? originalText : null;
}

export function _getOriginalHtmlContent(text) {
	const htmlNode = document.createElement('div');
	htmlNode.innerHTML = text;
	while (SCRIPT_REGEX.test(text)) {
		text = text.replace(SCRIPT_REGEX, '');
	}
	let done = false;
	const nodeList = [];
	_flatten(htmlNode, nodeList);
	const ln = nodeList.length;
	let i;
	const results = [];
	const count = {};
	let el;
	let prevEl;
	let nodeName;
	let type;
	let prevType;
	let sepNode;
	for (i = 0; i < ln; i++) {
		el = nodeList[i];
		if (el.nodeType === 1) {
			el.normalize();
		}
		nodeName = el.nodeName.toLowerCase();
		type = _checkNode(nodeList[i]);
		if (
			type === ORIG_UNKNOWN &&
			el.nodeName === '#text' &&
			(ORIG_DATE_RE.test(el.nodeValue) ||
				ORIG_INTRO_RE.test(el.nodeValue) ||
				ORIG_INTRO_DE_RE.test(el.nodeValue))
		) {
			let str = el.nodeValue;
			for (let j = 1; j < 10; j++) {
				const el1 = nodeList[i + j];
				if (el1 && el1.nodeName === '#text') {
					str += el1.nodeValue;
					if (/:$/.test(str)) {
						type = _getLineType(trim(str));
						if (type === ORIG_WROTE_STRONG) {
							i += j;
							break;
						}
					}
				}
			}
		}
		if (type !== null) {
			results.push({ type, node: el, nodeName });
			count[type] = count[type] ? count[type] + 1 : 1;
			if (type === ORIG_SEP_STRONG || type === ORIG_WROTE_STRONG) {
				sepNode = el;
				done = true;
				break;
			}
			if (type === ORIG_HEADER && prevType === ORIG_LINE) {
				sepNode = prevEl;
				done = true;
				break;
			}
			prevEl = el;
			prevType = type;
		}
	}
	if (sepNode) {
		_prune(sepNode, true);
	}
	const result = done && htmlNode.textContent ? htmlNode.innerHTML : text;
	return result;
}

export function replaceDuplicateDiv(text) {
	text = text.replace('</div></div>', '</div>');
	if (text.indexOf('</div></div>') !== -1) {
		text = replaceDuplicateDiv(text);
	}
	return text;
}
function plainTextToHTML(str) {
	if (str !== undefined && str !== null) {
		return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
	}
	return '';
}
export function getQuotedTextOnly(message, isHtmlContent) {
	const body = message;

	const originalContent = getOriginalContent(body, isHtmlContent);

	if (originalContent.length >= body.length - 5) {
		return '';
	}
	if (body !== undefined && body !== null && body !== '') {
		const parser = new DOMParser();
		const htmlDoc = parser.parseFromString(body, 'text/html');

		// htmlDoc.getElementsByTagName('body')[0];
		const htmlBody = htmlDoc.body.innerHTML;
		const indexList = [
			{
				name: 'zimbra',
				index: htmlBody.indexOf('id="zwchr">')
			},
			{
				name: 'gmail',
				index: htmlBody.indexOf('<div class="gmail_quote">')
			},
			{
				name: 'original',
				index: htmlBody.indexOf('Original Message')
			},
			{
				name: 'original_de',
				index: htmlBody.indexOf('Originalnachricht')
			},
			{
				name: 'forward',
				index: htmlBody.indexOf('Forwarded Message')
			},
			{
				name: 'forward_de',
				index: htmlBody.indexOf('Weitergeleitete Nachricht')
			},
			{
				name: 'blockquote',
				index: htmlBody.indexOf('<blockquote style="margin: 0 0 20px 0;">')
			}
		];
		let foundIndex = indexList.filter((v) => v.index !== -1);
		foundIndex = orderBy(foundIndex, 'index', 'asc');
		if (foundIndex.length > 0 && contentType === 'text/html') {
			const replaceBy = foundIndex[0]; // get quote from smallest index
			let quotedText = '';
			switch (replaceBy.name) {
				case 'zimbra': {
					htmlDoc.body.innerHTML = '';
					const zimbraQuoted = htmlBody.split('id="zwchr">');
					zimbraQuoted.splice(1).forEach((item) => {
						const div = htmlDoc.createElement('div');
						div.setAttribute('class', 'quoted_text');
						div.innerHTML = item;
						htmlDoc.body.appendChild(div);
					});
					quotedText = htmlDoc.body.innerHTML;
					break;
				}
				case 'gmail': {
					htmlDoc.body.innerHTML = '';
					const zimbraQuoted = htmlBody.split('<div class="gmail_quote">');
					zimbraQuoted.splice(1).forEach((item) => {
						const div = htmlDoc.createElement('div');
						div.setAttribute('class', 'quoted_text');
						div.innerHTML = item;
						htmlDoc.body.appendChild(div);
					});
					quotedText = htmlDoc.body.innerHTML;
					break;
				}
				case 'original': {
					const zimbraQuoted = htmlBody.split(/\s*--+\s*Original Message\s*--+\s*/gi);
					htmlDoc.body.innerHTML = '';
					zimbraQuoted.splice(1).forEach((item) => {
						const div = htmlDoc.createElement('div');
						div.innerHTML = item;
						htmlDoc.body.appendChild(div);
					});
					quotedText = `----- Original message -----${htmlDoc.body.innerHTML}`;
					break;
				}
				case 'original_de': {
					const zimbraQuoted = htmlBody.split(/\s*--+\s*Originalnachricht\s*--+\s*/gi);
					htmlDoc.body.innerHTML = '';
					zimbraQuoted.splice(1).forEach((item) => {
						const div = htmlDoc.createElement('div');
						div.innerHTML = item;
						htmlDoc.body.appendChild(div);
					});
					quotedText = `----- Originalnachricht -----${htmlDoc.body.innerHTML}`;
					break;
				}
				case 'forward': {
					const zimbraQuoted = htmlBody.split(/\s*--+\s*Forwarded Message\s*--+\s*/gi);
					htmlDoc.body.innerHTML = '';
					zimbraQuoted.splice(1).forEach((item) => {
						const div = htmlDoc.createElement('div');
						div.innerHTML = item;
						htmlDoc.body.appendChild(div);
					});
					quotedText = `----- Forwarded message -----${htmlDoc.body.innerHTML}`;
					break;
				}
				case 'forward_de': {
					const zimbraQuoted = htmlBody.split(/\s*--+\s*Weitergeleitete Nachricht\s*--+\s*/gi);
					htmlDoc.body.innerHTML = '';
					zimbraQuoted.splice(1).forEach((item) => {
						const div = htmlDoc.createElement('div');
						div.innerHTML = item;
						htmlDoc.body.appendChild(div);
					});
					quotedText = `----- Weitergeleitete Nachricht -----${htmlDoc.body.innerHTML}`;
					break;
				}
				case 'blockquote': {
					const zimbraQuoted = htmlBody.split('<blockquote style="margin: 0 0 20px 0;">');
					htmlDoc.body.innerHTML = '';
					zimbraQuoted.splice(1).forEach((item) => {
						const div = htmlDoc.createElement('div');
						div.innerHTML = item;
						htmlDoc.body.appendChild(div);
					});
					quotedText = htmlDoc.body.innerHTML;
					break;
				}
				default:
					break;
			}
			return quotedText;
		}
		if (
			htmlDoc.getElementsByClassName('OutlookMessageHeader').length > 0 &&
			htmlDoc.getElementsByClassName('OutlookMessageHeader')[0]
		) {
			const zimbraQuoted = htmlBody.split('class="OutlookMessageHeader">');
			htmlDoc.body.innerHTML = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.setAttribute('class', 'quoted_text');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return htmlDoc.body.innerHTML;
		}
		const originalMsg = parser.parseFromString(originalContent, 'text/html');
		const originalHTML = replaceDuplicateDiv(originalMsg.body.innerHTML);
		const bodyHTML = replaceDuplicateDiv(htmlDoc.body.innerHTML);
		const originalText = bodyHTML.slice(0, originalHTML.length);
		let quotedText = bodyHTML.split(originalText)[1];
		if (quotedText === '' || quotedText === undefined) {
			quotedText = plainTextToHTML(bodyHTML.slice(originalHTML.length, bodyHTML.length));
		}
		htmlDoc.body.innerHTML = '';
		const div = htmlDoc.createElement('div');
		div.setAttribute('class', 'quoted_text');
		if (contentType !== 'text/html') {
			quotedText = plainTextToHTML(quotedText);
		}
		div.innerHTML = quotedText;
		htmlDoc.body.appendChild(div);
		quotedText = htmlDoc.body.innerHTML;
		if (contentType !== 'text/html') {
			return plainTextToHTML(quotedText);
		}
		return quotedText;
	}
	return '';
}

export function getQuotedText(body) {
	if (body !== undefined && body !== null && body !== '') {
		const parser = new DOMParser();
		const htmlDoc = parser.parseFromString(body, 'text/html');

		//	htmlDoc.getElementsByTagName('body')[0];
		const htmlBody = htmlDoc.body.innerHTML;

		if (htmlBody.indexOf('id="zwchr">') !== -1) {
			htmlDoc.body.innerHTML = '';
			const zimbraQuoted = htmlBody.split('id="zwchr">');
			const allText = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.setAttribute('class', 'quoted_text');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return htmlDoc.body.innerHTML;
		}
		if (htmlBody.indexOf('<div class="gmail_quote">') !== -1) {
			htmlDoc.body.innerHTML = '';
			const zimbraQuoted = htmlBody.split('<div class="gmail_quote">');
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.setAttribute('class', 'quoted_text');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return htmlDoc.body.innerHTML;
		}
		if (
			htmlDoc.getElementsByClassName('OutlookMessageHeader').length > 0 &&
			htmlDoc.getElementsByClassName('OutlookMessageHeader')[0]
		) {
			const zimbraQuoted = htmlBody.split('class="OutlookMessageHeader">');
			htmlDoc.body.innerHTML = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.setAttribute('class', 'quoted_text');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return htmlDoc.body.innerHTML;
		}
		if (htmlBody.indexOf('<blockquote style="margin: 0 0 20px 0;">') !== -1) {
			const zimbraQuoted = htmlBody.split('<blockquote style="margin: 0 0 20px 0;">');
			htmlDoc.body.innerHTML = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return htmlDoc.body.innerHTML;
		}
		if (/\s*--+\s*Forwarded Message\s*--+\s*/gi.test(htmlBody)) {
			const zimbraQuoted = htmlBody.split(/\s*--+\s*Forwarded Message\s*--+\s*/gi);
			htmlDoc.body.innerHTML = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return `----- Forwarded message -----${htmlDoc.body.innerHTML}`;
		}
		if (/\s*--+\s*Weitergeleitete Nachricht\s*--+\s*/gi.test(htmlBody)) {
			const zimbraQuoted = htmlBody.split(/\s*--+\s*Weitergeleitete Nachricht\s*--+\s*/gi);
			htmlDoc.body.innerHTML = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return `---- Weitergeleitete Nachricht ----${htmlDoc.body.innerHTML}`;
		}
		const originalMsg = parser.parseFromString(_getOriginalHtmlContent(body), 'text/html');
		const quotedText = htmlDoc.body.innerHTML.split(originalMsg.body.innerHTML)[1];
		if (quotedText === '' || quotedText === undefined) {
			return '';
		}
		htmlDoc.body.innerHTML = '';
		const div = htmlDoc.createElement('div');
		div.setAttribute('class', 'quoted_text');
		div.innerHTML = quotedText;
		htmlDoc.body.appendChild(div);
		return htmlDoc.body.innerHTML;
	}
	return '';
}

// export function getLastMessageText(message, toSendOnly) {
// 	const body = addClassToAnchor(replaceLinkToAnchor(getEmailBody(message)));
// 	const parser = new DOMParser();
// 	const htmlDoc = parser.parseFromString(body, 'text/html');
// 	htmlDoc.getElementsByTagName('body')[0];
// 	const htmlBody = htmlDoc.body.innerHTML;
// 	if (/\s*--+\s*Original Message\s*--+\s*/gi.test(htmlBody)) {
// 		const zimbraQuoted = htmlBody.split(/\s*--+\s*Original Message\s*--+\s*/gi);
// 		htmlDoc.body.innerHTML = '';
// 		const div = htmlDoc.createElement('div');
// 		div.innerHTML = zimbraQuoted[0];
// 		htmlDoc.body.appendChild(div);
// 		return htmlDoc.body.innerHTML;
// 	}
// 	if (/\s*--+\s*Originalnachricht\s*--+\s*/gi.test(htmlBody)) {
// 		const zimbraQuoted = htmlBody.split(/\s*--+\s*Originalnachricht\s*--+\s*/gi);
// 		htmlDoc.body.innerHTML = '';
// 		zimbraQuoted.splice(1).forEach((item) => {
// 			const div = htmlDoc.createElement('div');
// 			div.innerHTML = item;
// 			htmlDoc.body.appendChild(div);
// 		});
// 		return htmlDoc.body.innerHTML;
// 	}
// 	return getEmailBody(message, toSendOnly);
// }

export function getOriginalQuotedText(body) {
	if (body !== undefined && body !== null && body !== '') {
		const parser = new DOMParser();
		const htmlDoc = parser.parseFromString(body, 'text/html');
		htmlDoc.getElementsByTagName('body')[0];
		const htmlBody = htmlDoc.body.innerHTML;

		if (htmlBody.indexOf('id="zwchr">') !== -1) {
			htmlDoc.body.innerHTML = '';
			const zimbraQuoted = htmlBody.split('id="zwchr">');
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.setAttribute('class', 'quoted_text');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return htmlDoc.body.innerHTML;
		}
		if (/\s*--+\s*Original Message\s*--+\s*/gi.test(htmlBody)) {
			const zimbraQuoted = htmlBody.split(/\s*--+\s*Original Message\s*--+\s*/gi);
			htmlDoc.body.innerHTML = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return `----- Original message -----${htmlDoc.body.innerHTML}`;
		}
		if (/\s*--+\s*Originalnachricht\s*--+\s*/gi.test(htmlBody)) {
			const zimbraQuoted = htmlBody.split(/\s*--+\s*Originalnachricht\s*--+\s*/gi);
			htmlDoc.body.innerHTML = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return `---- Originalnachricht ----${htmlDoc.body.innerHTML}`;
		}
		if (htmlBody.indexOf('id="zwchr">') !== -1) {
			htmlDoc.body.innerHTML = '';
			const zimbraQuoted = htmlBody.split('id="zwchr">');
			const allText = '';
			zimbraQuoted.splice(1).forEach((item) => {
				const div = htmlDoc.createElement('div');
				div.setAttribute('class', 'quoted_text');
				div.innerHTML = item;
				htmlDoc.body.appendChild(div);
			});
			return htmlDoc.body.innerHTML;
		}
		const originalMsg = parser.parseFromString(_getOriginalHtmlContent(body), 'text/html');
		const quotedText = htmlDoc.body.innerHTML.split(originalMsg.body.innerHTML)[1];
		if (quotedText === '' || quotedText === undefined) {
			return '';
		}
		htmlDoc.body.innerHTML = '';
		const div = htmlDoc.createElement('div');
		div.setAttribute('class', 'quoted_text');
		div.innerHTML = quotedText;
		htmlDoc.body.appendChild(div);
		return htmlDoc.body.innerHTML;
	}
	return '';
}

export function HTMLToPlainText(str) {
	if (str !== undefined && str !== null) {
		return str
			.replace(/<li>/gi, '  *  ')
			.replace(/<\/li>/gi, '\n')
			.replace(/<\/ul>/gi, '\n')
			.replace(/<\/div>/gi, '\n')
			.replace(/<\/p>/gi, '\n')
			.replace(/<[^>]+>/gi, '');
	}
	return '';
}

export function getPlainText(str) {
	if (str !== undefined && str !== null) {
		return str
			.replace(/<\/div>/gi, '\n')
			.replace(/<p>/gi, '')
			.replace(/<\/p>/gi, '\n')
			.replace(/<br \/>/gi, '\n')
			.replace(/<br>/gi, '\n')
			.replace(/&nbsp;/gi, ' ')
			.replace(/<[^>]+>/gi, '');
	}
	return '';
}

export function spellCheck(node, regexp) {
	switch (node.nodeType) {
		case 1:
			for (let i = node.firstChild; i; i = spellCheck(i, regexp)) {}
			node = node.nextSibling;
			break;
		case 3:
			if (!/[^\s\xA0]/.test(node.data)) {
				node = node.nextSibling;
				break;
			}
			let a = null;
			let b = null;
			let result = /^[\s\xA0]+/.exec(node.data);
			if (result) {
				a = node;
				node = node.splitText(result[0].length);
			}
			result = /[\s\xA0]+$/.exec(node.data);
			if (result) {
				b = node.splitText(node.data.length - result[0].length);
			}

			let text = hightLightWord(node.data, false, regexp);
			text = text.replace(/^ +/, '&nbsp;').replace(/ +$/, '&nbsp;');
			let div = document.createElement('div');
			div.innerHTML = text;

			if (a) {
				div.insertBefore(a, div.firstChild);
			}
			if (b) {
				div.appendChild(b);
			}

			const p = node.parentNode;
			while (div.firstChild) {
				p.insertBefore(div.firstChild, node);
			}

			div = node.nextSibling;
			p.removeChild(node);
			node = div;
			break;
		default:
			node = node.nextSibling;
	}
	return node;
}

export function hightLightWord(text, textWhiteSpace, regexp) {
	const wordIds = {};
	const spanIds = {};
	text = textWhiteSpace ? convertToHtml(text) : htmlEncode(text);
	let m;
	regexp.lastIndex = 0;
	while ((m = regexp.exec(text))) {
		const str = m[0];
		const prefix = m[1];
		const word = m[2];
		const suffix = m[3];
		const id = 44;
		spanIds[id] = word;
		if (!wordIds[word]) wordIds[word] = [];
		wordIds[word].push(id);

		const repl = [
			prefix,
			'<span word="',
			word,
			'" id="',
			id,
			'" class="spell_check_mis_spell">',
			word,
			'</span>',
			suffix
		].join('');
		text = [text.substr(0, m.index), repl, text.substr(m.index + str.length)].join('');
		regexp.lastIndex = m.index + repl.length - suffix.length;
	}
	return text;
}

export function convertToHtml(str, quotePrefix, openTag, closeTag) {
	openTag = openTag || '<blockquote>';
	closeTag = closeTag || '</blockquote>';
	if (!str) {
		return '';
	}
	str = htmlEncode(str);
	if (quotePrefix) {
		const prefixRe = /^(>|&gt;|\|\s+)/;
		const lines = str.split(/\r?\n/);
		let level = 0;
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (line.length > 0) {
				let lineLevel = 0;
				while (line.match(prefixRe)) {
					line = line.replace(prefixRe, '');
					lineLevel++;
				}
				while (lineLevel > level) {
					line = openTag + line;
					level++;
				}
				while (lineLevel < level) {
					lines[i - 1] = lines[i - 1] + closeTag;
					level--;
				}
			}
			lines[i] = line;
		}
		while (level > 0) {
			lines.push(closeTag);
			level--;
		}
		str = lines.join('\n');
	}

	str = str
		.replace(/ {2}/gm, ' &nbsp;')
		.replace(/^ /gm, '&nbsp;')
		.replace(/\t/gm, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
		.replace(/\r?\n/gm, '<br>');

	return str;
}

export function htmlEncode(str, includeSpaces) {
	if (!str) {
		return '';
	}
	if (typeof str !== 'string') {
		str = str.toString ? str.toString() : '';
	}
	if (includeSpaces) {
		return str
			.replace(/[&]/g, '&amp;')
			.replace(/ {2}/g, ' &nbsp;')
			.replace(/[<]/g, '&lt;')
			.replace(/[>]/g, '&gt;');
	}
	return str.replace(/[&]/g, '&amp;').replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;');
}
