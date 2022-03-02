/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { forEach, reduce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { Container, Text } from '@zextras/carbonio-design-system';

const _CI_REGEX = /^<(.*)>$/;
const _CI_SRC_REGEX = /^cid:(.*)$/;
const replaceLinkToAnchor = (content) => {
	if (content === '' || content === undefined) {
		return '';
	}
	return content.replace(
		/(?:https?:\/\/|www\.)+(?![^\s]*?")([\w.,@?!^=%&amp;:()/~+#-]*[\w@?!^=%&amp;()/~+#-])?/gi,
		(url) => {
			const wrap = document.createElement('div');
			const anchor = document.createElement('a');
			let href = url.replace(/&amp;/g, '&');
			if (!url.startsWith('http') && !url.startsWith('https')) {
				href = `http://${url}`;
			}
			anchor.href = href.replace(/&#64;/g, '@').replace(/&#61;/g, '=');
			anchor.target = '_blank';
			anchor.innerHTML = url;
			wrap.appendChild(anchor);
			return wrap.innerHTML;
		}
	);
};

const plainTextToHTML = (str) => {
	if (str !== undefined && str !== null) {
		return str?.replace(/(?:\r\n|\r|\n)/g, '<br />');
	}
	return '';
};
export function _getParentPath(path) {
	const p = path.split('.');
	p.pop();
	return p.join('.');
}

function findAttachments(parts, acc) {
	return reduce(
		parts,
		(found, part) => {
			if (part && (part.disposition === 'attachment' || part.disposition === 'inline')) {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

const _TextMessageRenderer = ({ body }) => {
	const convertedHTML = useMemo(
		() => replaceLinkToAnchor(plainTextToHTML(body.content)),
		[body.content]
	);
	return (
		<Text
			dangerouslySetInnerHTML={{
				__html: convertedHTML
			}}
			color="text"
			style={{ fontFamily: 'monospace' }}
			overflow="breakword"
		/>
	);
};

const _HtmlMessageRenderer = ({ msgId, body, parts }) => {
	const divRef = useRef();
	const iframeRef = useRef();
	// const settings = useUserSettings();
	// const darkMode = useMemo(
	// 	() => find(settings.props, ['name', 'zappDarkreaderMode'])?._content,
	// 	[settings]
	// );
	const calculateHeight = () => {
		iframeRef.current.style.height = '0px';
		iframeRef.current.style.height = `${iframeRef.current.contentDocument.body.scrollHeight}px`;
	};

	useLayoutEffect(() => {
		iframeRef.current.contentDocument.open();
		iframeRef.current.contentDocument.write(body.content);
		iframeRef.current.contentDocument.close();

		const styleTag = document.createElement('style');
		const styles = `
			max-width: 100% !important;
			body {
				max-width: 100% !important;
				margin: 0;
				overflow-y: hidden;
				font-family: Roboto, sans-serif;
				font-size: 14px;
				${/* visibility: ${darkMode && darkMode !== 'disabled' ? 'hidden' : 'visible'}; */ ''}
				background-color: #ffffff;
			}
			body pre, body pre * {
				white-space: pre-wrap;
				word-wrap: anywhere !important;
				text-wrap: suppress !important;
			}
			img {
				max-width: 100%
			}
			tbody{position:relative !important}
			td{
				max-width: 100% !important;
				overflow-wrap: anywhere !important;
			}
		`;
		styleTag.textContent = styles;
		iframeRef.current.contentDocument.head.append(styleTag);

		// TODO: fix Dark Reader inside iframes
		// if (darkMode && darkMode !== 'disabled') {
		// 	const modeSetting = darkMode === 'enabled' ? 'enable' : 'auto';
		// 	const darkReaderScript = document.createElement('script');
		// 	darkReaderScript.src = 'https://cdn.jsdelivr.net/npm/darkreader@4.9.32/darkreader.min.js';
		// 	darkReaderScript.type = 'application/javascript';
		// 	iframeRef.current.contentDocument.body.append(darkReaderScript);
		// 	const darkScriptEnable = document.createElement('script');
		// 	darkScriptEnable.textContent = `if (document.readyState === 'complete') {document.body.style.visibility = 'visible';} else {window.onload = function(){ DarkReader.${modeSetting}();document.body.style.visibility = 'visible';}}`;
		// 	iframeRef.current.contentDocument.body.append(darkScriptEnable);
		// }

		calculateHeight();

		const imgMap = reduce(
			parts,
			(r, v) => {
				if (!_CI_REGEX.test(v.ci)) return r;
				r[_CI_REGEX.exec(v.ci)[1]] = v;
				return r;
			},
			{}
		);

		const images = iframeRef.current.contentDocument.body.getElementsByTagName('img');

		forEach(images, (p) => {
			if (p.hasAttribute('dfsrc')) {
				p.setAttribute('src', p.getAttribute('dfsrc'));
			}
			if (!_CI_SRC_REGEX.test(p.src)) return;
			const ci = _CI_SRC_REGEX.exec(p.getAttribute('src'))[1];
			if (imgMap[ci]) {
				const part = imgMap[ci];
				p.setAttribute('pnsrc', p.getAttribute('src'));
				p.setAttribute('src', `/service/home/~/?auth=co&id=${msgId}&part=${part.name}`);
			}
		});

		const resizeObserver = new ResizeObserver(calculateHeight);
		resizeObserver.observe(divRef.current);

		return () => resizeObserver.disconnect();
	}, [body, parts, msgId]);

	return (
		<div ref={divRef} className="force-white-bg">
			<iframe
				title={msgId}
				ref={iframeRef}
				onLoad={calculateHeight}
				style={{
					border: 'none',
					width: '100%',
					display: 'block',
					maxWidth: '100%'
				}}
			/>
		</div>
	);
};

const EmptyBody = () => {
	const { t } = useTranslation();

	return (
		<Container padding={{ bottom: 'medium' }}>
			<Text>{`(${t('messages.no_content', 'This message has no text content')}.)`}</Text>
		</Container>
	);
};

const MailMessageRenderer = ({ mailMsg, onLoadChange }) => {
	const parts = findAttachments(mailMsg.parts ?? [], []);
	useEffect(() => {
		if (!mailMsg.read) {
			onLoadChange();
		}
	}, [mailMsg.read, onLoadChange]);
	if (!mailMsg.body?.content?.length && !mailMsg.fragment) {
		return <EmptyBody />;
	}
	if (mailMsg.body?.contentType === 'text/html') {
		return <_HtmlMessageRenderer msgId={mailMsg.id} body={mailMsg.body} parts={parts} />;
	}
	if (mailMsg.body?.contentType === 'text/plain') {
		return <_TextMessageRenderer body={mailMsg.body} />;
	}
	return <EmptyBody />;
};
export default MailMessageRenderer;
