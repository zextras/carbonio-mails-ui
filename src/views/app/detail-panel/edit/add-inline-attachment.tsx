/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, map, reduce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { uploadInlineAttachments } from '../../../../store/actions/upload-inline-attachments';
import {
	EditorAttachmentFiles,
	InlineAttachedType,
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
	updateEditorCb: (arg: Partial<MailsEditor>) => { payload: AddAttachmentsPayloadType };
	files: File[];
	tinymce: any;
	setIsReady: (arg: boolean) => void;
	editor: MailsEditor;
};

export const addInlineAttachments = async ({
	files,
	tinymce,
	updateEditorCb,
	setIsReady,
	editor
}: InputProps): Promise<any> => {
	const aids = await uploadInlineAttachments({ files });

	const attachAids: InlineAttachedType = editor?.inline ? [...editor.inline] : [];
	const imageTextArray: Array<string> = [];

	forEach(aids, (aid, index) => {
		const ci = uuidv4();
		attachAids.push({ ci: `${ci}@zimbra`, attach: aid });
		imageTextArray.push(
			`&nbsp;<img pnsrc="cid:${ci}@zimbra" data-mce-src="cid:${ci}@zimbra" src="cid:${ci}@zimbra" />`
		);
		if (Number(index) === aids.length - 1) {
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
	acc: Array<EditorAttachmentFiles>
): Array<EditorAttachmentFiles> {
	return reduce(
		parts,
		(found, part: any) => {
			if (part && part.cd === 'inline') {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

type GetConvertedImageSourcesType = {
	message: MailMessage;
	updateEditorCb: (arg: Partial<MailsEditor>) => { payload: AddAttachmentsPayloadType };
	setValue: (name: string, value: any) => void;
	setInputValue: (arg: [string, string]) => void;
	inputValue: [string, string];
};
export const getConvertedImageSources = ({
	message,
	updateEditorCb,
	setValue,
	setInputValue,
	inputValue
}: GetConvertedImageSourcesType): void => {
	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(message.body.content, 'text/html');

	const images = htmlDoc.getElementsByTagName('img');

	const parts = findAttachments(message.parts ?? [], []);
	const imgMap = reduce(
		parts,
		(r, v) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (!_CI_REGEX.test(v.ci ?? '')) return r;
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
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
	const newInline = map(newInlineparts, (pt: { ci: string; name: string }) => ({
		ci: pt.ci.replace('<', '').replace('>', '').trim(),
		attach: {
			mp: [{ mid: message?.id, part: pt.name }]
		}
	}));
	updateEditorCb({
		text: [inputValue[0], newHtml],
		inline: newInline
	});
	setValue('text', [inputValue[0], newHtml]);
	setInputValue([inputValue[0], newHtml]);
};
