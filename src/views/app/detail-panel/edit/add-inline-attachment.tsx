/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AsyncThunkAction } from '@reduxjs/toolkit';
import { cloneDeep, forEach, map, reduce } from 'lodash';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import {
	generateBody,
	normalizeMailMessageFromSoap
} from '../../../../normalizations/normalize-message';
import { selectEditors } from '../../../../store/editor-slice';
import { retrieveAttachmentsType } from '../../../../store/editor-slice-utils';
import {
	EditorAttachmentFiles,
	MailAttachmentParts,
	MailMessage,
	MailMessagePart,
	MailsEditor
} from '../../../../types';

type AddAttachmentsPayloadType = {
	resp: {
		m: Array<any>;
		_jsns: 'urn:zimbraMail';
	};
};

type UploadAttachmentsCbType = (files: any) => AsyncThunkAction<any, any, any>;
export const retrieveInlineAttachments = (
	original: MailMessage,
	disposition: string
): Array<MailAttachmentParts> =>
	reduce(
		original?.parts?.[0]?.parts ?? [],
		(acc, part) =>
			part.ci && part.ci === disposition ? [...acc, { part: part.name, mid: original.id }] : acc,
		[] as Array<MailAttachmentParts>
	);
type InputProps = {
	saveDraftCb: (arg: Partial<MailsEditor>) => { payload: AddAttachmentsPayloadType };
	compositionData: Partial<MailsEditor>;
	aids: Array<{ aid: string }>;
	tinymce: unknown;
};

export const addInlineAttachments = async ({
	aids,
	tinymce,
	updateEditorCb,
	setIsReady,
	editor
}: InputProps): Promise<MailAttachmentParts[] | undefined> => {
	// const { payload } = await saveDraftCb(compositionData);

	const attachAids = [...editor?.inline];
	const imageTextArray = [];
	const isReady = false;
	forEach(aids, (aid, index) => {
		const ci = uuidv4();
		attachAids.push({ ci: `${ci}@zimbra`, attach: aid });
		imageTextArray.push(
			`&nbsp;<img pnsrc="cid:${ci}@zimbra" data-mce-src="cid:${ci}@zimbra" src="cid:${ci}@zimbra" />`
		);
		if (index === aids.length - 1) {
			tinymce?.activeEditor?.insertContent(imageTextArray?.join('<br />'));
			updateEditorCb({
				inline: attachAids
			});
			setTimeout(() => setIsReady(true), 10);
		}
	});
};

export const _CI_REGEX = /^<(.*)>$/;
export const _CI_SRC_REGEX = /^cid:(.*)$/;

export function findAttachments(
	parts: MailMessagePart[],
	acc: Array<EditorAttachmentFiles>
): Array<EditorAttachmentFiles> {
	return reduce(
		parts,
		(found, part: any) => {
			if (part && (part.disposition === 'attachment' || part.disposition === 'inline') && part.ci) {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

export function findInlineAttachments(
	parts: MailMessagePart[],
	acc: MailMessagePart[]
): AttachmentPartType[] {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return reduce(
		parts,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		(found, part: MailMessagePart) => {
			if (part && part.cd === 'inline') {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

export const getConvertedImageSources = ({
	data: message,
	updateEditorCb,
	setValue,
	setInputValue,
	editor
}): void => {
	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(message.body.content, 'text/html');

	const images = htmlDoc.getElementsByTagName('img');

	const parts = findAttachments(message.parts ?? [], []);
	const imgMap = reduce(
		parts,
		(r, v) => {
			if (!_CI_REGEX.test(v.ci ?? '')) return r;
			r[_CI_REGEX.exec(v.ci ?? '')?.[1] ?? ''] = v;
			return r;
		},
		{} as any
	);

	if (images) {
		forEach(images, (p: HTMLImageElement) => {
			if (p.hasAttribute('dfsrc')) {
				p.setAttribute('src', p.getAttribute('dfsrc') ?? '');
			}
			if (!_CI_SRC_REGEX.test(p.src)) return;
			const ci = _CI_SRC_REGEX.exec(p.getAttribute('src') ?? '')?.[1] ?? '';
			if (imgMap[ci]) {
				const part = imgMap[ci];
				p.setAttribute('pnsrc', p.getAttribute('src') ?? '');
				p.setAttribute('src', `/service/home/~/?auth=co&id=${message.id}&part=${part.name}`);
			}
		});
	}
	const newHtml = htmlDoc.body.innerHTML;

	const newInlineparts = findInlineAttachments(message?.parts, []);
	console.log('abcde:', { newInlineparts, message });

	const newInline = map(newInlineparts, (pt) => ({
		ci: pt.ci.replace('<', '').replace('>', '').trim(),
		attach: {
			mp: [{ mid: message?.id, part: pt.name }]
		}
	}));
	updateEditorCb({
		text: [newHtml, newHtml],
		// orignalText: ['hello', message.body.content],
		inline: newInline
	});
	setValue('text', [newHtml, newHtml]);
	setInputValue([newHtml, newHtml]);
};
