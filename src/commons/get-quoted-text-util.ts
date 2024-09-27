/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { orderBy } from 'lodash';

import { LineType } from './utils';

const contentType = 'text/html';
const NON_WHITESPACE_REGEX = /\S+/;
const TRIM_REGEX = /^\s+|\s+$/g;

// Regexes for finding stuff in msg content
const SPLIT_REGEX = /\r\n|\r|\n/;

// regexes for finding a delimiter such as "On DATE, NAME (EMAIL) wrote:"
const ORIG_EMAIL_REGEX = /[^@\s]+@[A-Za-z0-9-]{2,}(\.[A-Za-z0-9-]{2,})+/;

// matches "03/07/2014" or "March 3, 2014" by looking for year 20xx
const ORIG_DATE_REGEX = /\d+\s*(\/|-|, )20\d\d/;

// eslint-disable-next-line no-useless-concat
const ORIG_INTRO_DE_REGEX = new RegExp('^(-{2,}|' + 'auf' + '\\s+)', 'i');

// eslint-disable-next-line no-useless-concat
const ORIG_INTRO_REGEX = new RegExp('^(-{2,}|' + 'on' + '\\s+)', 'i');

type LineTypeValue = (typeof LineType)[keyof typeof LineType];

// We don't know the meaning of this, it's a type introduced when refactoring from .js
type ResultTypeAndBlock = {
	type: LineTypeValue;
	block: string[];
};

const MSG_REGEXES = [
	{
		type: LineType.ORIG_QUOTED,
		// regex: /^\s*(>|\|)/
		regex: /^[>|].*/
	},
	{
		type: LineType.ORIG_SEP_STRONG,
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
		type: LineType.ORIG_SEP_STRONG,
		// eslint-disable-next-line no-useless-concat
		regex: new RegExp('^' + 'Begin forwarded message:' + '$', 'i')
	},
	{
		type: LineType.ORIG_HEADER,
		regex: new RegExp(`^\\s*(${['from:', 'to:', 'subject:', 'date:', 'sent:', 'cc:'].join('|')}).*`)
	},
	{
		type: LineType.ORIG_LINE,
		regex: /^\\s*_{5,}\\s*$/
	}
];

const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

const IGNORE_NODE: Record<string, boolean> = {
	'#comment': true,
	br: true,
	script: true,
	select: true,
	style: true
};

const flatten = (node: ChildNode, list: Array<ChildNode>): void => {
	const nodeName = node && node.nodeName.toLowerCase();
	if (IGNORE_NODE[nodeName]) {
		return;
	}
	list.push(node);
	const children = node.childNodes || [];
	for (let i = 0; i < children.length; i += 1) {
		const child = children[i];
		flatten(child, list);
	}
};

function getLineType(testLine: string): LineTypeValue {
	let type: LineTypeValue = LineType.ORIG_UNKNOWN;
	for (let j = 0; j < MSG_REGEXES.length; j += 1) {
		const msgTest = MSG_REGEXES[j];
		const { regex } = msgTest;
		if (msgTest.type !== LineType.ORIG_HEADER) {
			if (regex.test(testLine.toLowerCase())) {
				if (msgTest.type === LineType.ORIG_QUOTED && /^\s*\|.*\|\s*$/.test(testLine)) {
					// eslint-disable-next-line no-continue
					continue;
				}
				type = msgTest.type;
				break;
			}
		}
	}

	if (type === LineType.ORIG_UNKNOWN) {
		const m = testLine.match(/(\w+):$/);
		const verb = m && m[1] && m[1].toLowerCase();
		if (verb) {
			let points = 0;
			// eslint-disable-next-line no-nested-ternary
			points = points ? 5 : verb === 'changed' ? 0 : 2;
			if (ORIG_EMAIL_REGEX.test(testLine)) {
				points += 4;
			}
			if (ORIG_DATE_REGEX.test(testLine)) {
				points += 3;
			}
			if (points >= 7) {
				type = LineType.ORIG_WROTE_STRONG;
			}
			if (points >= 5) {
				type = LineType.ORIG_WROTE_WEAK;
			}
		}
	}
	return type;
}

function checkNodeContent(node: ChildNode): LineTypeValue | null {
	const content = node.textContent || '';
	if (!NON_WHITESPACE_REGEX.test(content) || content.length > 200) {
		return null;
	}

	const type = getLineType(content);
	return type === LineType.ORIG_SEP_STRONG || type === LineType.ORIG_WROTE_STRONG ? type : null;
}

// TODO: can it be replaced with trim by lodash?
export function trim(str: string | null): string {
	if (!str) {
		return '';
	}

	return str.replace(TRIM_REGEX, '');
}

function isHRElement(nodeName: string, el: unknown): el is HTMLHRElement {
	return nodeName === 'hr' && (el as HTMLHRElement).width !== undefined;
}

function isDivElement(nodeName: string, el: unknown): el is HTMLDivElement {
	return nodeName === 'div' && (el as HTMLDivElement).className !== undefined;
}

function checkNode(el: HTMLHRElement | HTMLDivElement | ChildNode): LineTypeValue | null {
	if (!el) {
		return null;
	}
	const nodeName = el.nodeName.toLowerCase();
	let type = null;
	if (nodeName === '#text') {
		const content = trim(el.nodeValue);
		if (NON_WHITESPACE_REGEX.test(content)) {
			type = getLineType(content);
		}
	} else if (isHRElement(nodeName, el)) {
		if (
			el.id === LineType.HTML_SEP_ID ||
			(el.size === '2' && el.width === '100%' && el.align === 'center')
		) {
			type = LineType.ORIG_SEP_STRONG;
		} else {
			type = LineType.ORIG_LINE;
		}
	} else if (nodeName === 'pre') {
		type = checkNodeContent(el);
	} else if (isDivElement(nodeName, el)) {
		if (el.className === 'OutlookMessageHeader' || el.className === 'gmail_quote') {
			type = LineType.ORIG_SEP_STRONG;
		}
		type = type || checkNodeContent(el);
	} else if (nodeName === 'span') {
		type = type || checkNodeContent(el);
	} else if (nodeName === 'img') {
		type = LineType.ORIG_UNKNOWN;
	} else if (nodeName === 'blockquote') {
		type = LineType.ORIG_QUOTED;
	}
	return type;
}

function prune(node: Node, clipNode: boolean): void {
	const p = node && node.parentNode;
	while (p && p.lastChild && p.lastChild !== node) {
		p.removeChild(p.lastChild);
	}
	if (clipNode && p && p.lastChild === node) {
		p.removeChild(p.lastChild);
	}
	const nodeName = p && p.nodeName.toLowerCase();
	if (p && nodeName !== 'body' && nodeName !== 'html') {
		prune(p, false);
	}
}

export function getOriginalHtmlContent(text: string): string {
	if (!text) {
		return '';
	}
	const htmlNode = document.createElement('div');
	htmlNode.innerHTML = text;
	while (SCRIPT_REGEX.test(text)) {
		text = text.replace(SCRIPT_REGEX, '');
	}
	let done = false;
	const nodeList: Array<ChildNode> = [];
	flatten(htmlNode, nodeList);
	const ln = nodeList.length;
	let i;
	const results = [];
	const count: Record<string, number> = {};
	let el;
	let prevEl;
	let nodeName;
	let type;
	let prevType;
	let sepNode;
	for (i = 0; i < ln; i += 1) {
		el = nodeList[i];
		if (el.nodeType === 1) {
			el.normalize();
		}
		nodeName = el.nodeName.toLowerCase();
		type = checkNode(nodeList[i]);
		if (
			type === LineType.ORIG_UNKNOWN &&
			el.nodeName === '#text' &&
			(ORIG_DATE_REGEX.test(el.nodeValue as string) ||
				ORIG_INTRO_REGEX.test(el.nodeValue as string) ||
				ORIG_INTRO_DE_REGEX.test(el.nodeValue as string))
		) {
			let str = el.nodeValue as string;
			for (let j = 1; j < 10; j += 1) {
				const el1 = nodeList[i + j];
				if (el1 && el1.nodeName === '#text') {
					str += el1.nodeValue;
					if (/:$/.test(str)) {
						type = getLineType(trim(str));
						if (type === LineType.ORIG_WROTE_STRONG) {
							i += j;
							break;
						}
					}
				}
			}
		}
		if (type !== null) {
			results.push({ type, node: el, nodeName });
			count[type as string] = count[type] ? count[type] + 1 : 1;
			if (type === LineType.ORIG_SEP_STRONG || type === LineType.ORIG_WROTE_STRONG) {
				sepNode = el;
				done = true;
				break;
			}
			if (type === LineType.ORIG_HEADER && prevType === LineType.ORIG_LINE) {
				sepNode = prevEl;
				done = true;
				break;
			}
			prevEl = el;
			prevType = type;
		}
	}
	if (sepNode) {
		prune(sepNode, true);
	}
	return done && htmlNode.textContent ? htmlNode.innerHTML : text;
}

function getTextFromBlock(block: Array<string> | undefined): string | null {
	if (!(block && block.length)) {
		return null;
	}
	let originalText = `${block.join('\n')}\n`;
	originalText = originalText.replace(/\s+$/, '\n');
	return NON_WHITESPACE_REGEX.test(originalText) ? originalText : null;
}

function checkInlineWrote(
	count: Record<LineTypeValue, number>,
	results: Array<ResultTypeAndBlock>
): string | null {
	if (count[LineType.ORIG_WROTE_STRONG] > 0) {
		let unknownBlock;
		let foundSep = false;
		const afterSep = {} as Record<LineTypeValue, boolean>;
		for (let i = 0; i < results.length; i += 1) {
			const result = results[i];
			const { type } = result;
			if (type === LineType.ORIG_WROTE_STRONG) {
				foundSep = true;
			} else if (type === LineType.ORIG_UNKNOWN && !foundSep) {
				if (unknownBlock) {
					return null;
				}

				unknownBlock = result.block;
			} else if (foundSep) {
				afterSep[type] = true;
			}
		}

		const mixed = afterSep[LineType.ORIG_UNKNOWN] && afterSep[LineType.ORIG_QUOTED];
		const endsWithUnknown =
			count[LineType.ORIG_UNKNOWN] === 2 &&
			results[results.length - 1].type === LineType.ORIG_UNKNOWN;
		if (unknownBlock && (!mixed || endsWithUnknown)) {
			const originalText = getTextFromBlock(unknownBlock);
			if (originalText) {
				return originalText;
			}
		}
	}
	return null;
}

function replaceDuplicateDiv(text: string): string {
	text = text.replace('</div></div>', '</div>');
	if (text.indexOf('</div></div>') !== -1) {
		text = replaceDuplicateDiv(text);
	}
	return text;
}

function plainTextToHTML(str: string): string {
	if (str !== undefined && str !== null) {
		return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
	}
	return '';
}

export function getOriginalTextContent(text: string): string {
	if (!text) {
		return '';
	}

	const results: Array<ResultTypeAndBlock> = [];
	const lines = text.split(SPLIT_REGEX);

	let curType;
	let curBlock = [];
	const count: Record<string, number> = {};
	let isMerged;
	let unknownBlock;
	let isBugzilla = false;
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		let testLine = trim(line);

		// blank lines are just added to the current block
		if (!NON_WHITESPACE_REGEX.test(testLine)) {
			curBlock.push(line);
			// <--->
			// continue;
		}

		// Bugzilla summary looks like QUOTED; it should be treated as UNKNOWN
		if (testLine.indexOf('| DO NOT REPLY') === 0 && lines[i + 2].indexOf('bugzilla') !== -1) {
			isBugzilla = true;
		}

		let type = getLineType(testLine);
		if (type === LineType.ORIG_QUOTED) {
			type = isBugzilla ? LineType.ORIG_UNKNOWN : type;
		} else {
			isBugzilla = false;
		}

		// WROTE can stretch over two lines; if so, join them into one line
		let nextLine = lines[i + 1];
		isMerged = false;

		if (
			nextLine &&
			type === LineType.ORIG_UNKNOWN &&
			(ORIG_INTRO_REGEX.test(testLine) || ORIG_INTRO_DE_REGEX.test(testLine)) &&
			nextLine.match(/\w+:$/)
		) {
			testLine = [testLine, nextLine].join(' ');
			type = getLineType(testLine);
			isMerged = true;
		}

		// LINE sometimes used as delimiter; if HEADER follows, lump it in with them
		if (type === LineType.ORIG_LINE) {
			let j = i + 1;
			nextLine = lines[j];
			while (!NON_WHITESPACE_REGEX.test(nextLine) && j < lines.length) {
				// eslint-disable-next-line no-plusplus
				nextLine = lines[++j];
			}
			const nextType = nextLine && getLineType(nextLine);
			if (nextType === LineType.ORIG_HEADER) {
				type = LineType.ORIG_HEADER;
			} else {
				type = LineType.ORIG_UNKNOWN;
			}
		}

		// see if we're switching to a new type; if so, package up what we have so far
		if (curType) {
			if (curType !== type) {
				results.push({ type: curType, block: curBlock });
				unknownBlock = curType === LineType.ORIG_UNKNOWN ? curBlock : unknownBlock;
				count[curType] = count[curType] ? count[curType] + 1 : 1;
				curBlock = [];
				curType = type;
			}
		} else {
			curType = type;
		}

		if (isMerged && (type === LineType.ORIG_WROTE_WEAK || type === LineType.ORIG_WROTE_STRONG)) {
			curBlock.push(line);
			curBlock.push(nextLine);
			i += 1;
			isMerged = false;
		} else {
			curBlock.push(line);
		}
	}

	// Handle remaining content
	if (curBlock.length) {
		results.push({ type: curType as LineTypeValue, block: curBlock });
		unknownBlock = curType === LineType.ORIG_UNKNOWN ? curBlock : unknownBlock;
		count[curType as string] = count[curType as string] ? count[curType as string] + 1 : 1;
	}

	// Now it's time to analyze all these blocks that we've classified

	// Check for UNKNOWN followed by HEADER
	const first = results[0];
	const second = results[1];
	if (
		first &&
		first.type === LineType.ORIG_UNKNOWN &&
		second &&
		(second.type === LineType.ORIG_HEADER || second.type === LineType.ORIG_WROTE_STRONG)
	) {
		const originalText = getTextFromBlock(first.block);
		if (originalText) {
			const third = results[2];
			if (third && third.type === LineType.ORIG_UNKNOWN) {
				const originalThirdText = getTextFromBlock(third.block);
				if (originalThirdText && originalThirdText.indexOf(LineType.NOTES_SEPARATOR) !== -1) {
					return originalText + originalThirdText;
				}
			}
			return originalText;
		}
	}

	// check for special case of WROTE preceded by UNKNOWN, followed by mix of UNKNOWN and QUOTED (inline reply)

	let originalText = checkInlineWrote(count, results);
	if (originalText) {
		return originalText;
	}

	// If we found quoted content and there's exactly one UNKNOWN block, return it.
	if (count[LineType.ORIG_UNKNOWN] === 1 && count[LineType.ORIG_QUOTED] > 0) {
		originalText = getTextFromBlock(unknownBlock);
		if (originalText) {
			return originalText;
		}
	}

	// If we have a STRONG separator (eg "--- Original Message ---"), consider it authoritative and return the text that precedes it
	if (count[LineType.ORIG_SEP_STRONG] > 0) {
		let block: Array<string> = [];
		for (let i = 0; i < results.length; i += 1) {
			const result = results[i];
			if (result.type === LineType.ORIG_SEP_STRONG) {
				break;
			}
			block = block.concat(result.block);
		}
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		originalText = getTextFromBlock(block);
		if (originalText) {
			return originalText;
		}
	}

	return text;
}

export function getQuotedTextFromOriginalContent(body: string, originalContent: string): string {
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
				index: htmlBody.indexOf('<blockquote style="margin: 0 0 1.25rem 0;">')
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
					const zimbraQuoted = htmlBody.split('<blockquote style="margin: 0 0 1.25rem 0;">');
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

export function htmlEncode(str: string | object, includeSpaces: boolean): string {
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
