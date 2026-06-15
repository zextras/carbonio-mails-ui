/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';

import { RichTextEditorContainer } from '../rich-text-editor-container';
import type { TipTapEditorProps, TipTapEditorValue } from '../tiptap/tiptap-editor';
import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { SavedAttachment } from 'types/attachments';

/*
 * Captures the `value` prop that RichTextEditorContainer feeds to TipTapEditor
 * on every render. The container derives `value.richText` by running
 * `replaceCidUrlWithServiceUrl` over the store text, so these captures let us
 * assert the CID -> service-url substitution without a real editor instance.
 */
const capturedValues = vi.hoisted(() => [] as TipTapEditorValue[]);

// noinspection JSUnusedGlobalSymbols
vi.mock('views/app/detail-panel/edit/parts/tiptap/tiptap-editor', () => ({
	TipTapEditor: ({ value }: TipTapEditorProps): React.JSX.Element => {
		capturedValues.push(value);
		return <div data-testid="mock-tiptap-editor" />;
	}
}));

const createInlineSavedAttachment = (
	overrides: Partial<SavedAttachment> = {}
): SavedAttachment => ({
	messageId: '100',
	partName: '2',
	isInline: true,
	contentId: 'abc123@carbonio',
	filename: 'image.png',
	contentType: 'image/png',
	size: 1024,
	...overrides
});

const lastValue = (): TipTapEditorValue => capturedValues[capturedValues.length - 1];

const setStoreText = (editorId: string, richText: string, plainText: string): void => {
	act(() => {
		useEditorsStore.getState().setText(editorId, { richText, plainText });
	});
};

describe('RichTextEditorContainer - inline image display', () => {
	beforeEach(() => {
		capturedValues.length = 0;
		useUserSettings.mockReturnValue({
			prefs: {
				zimbraPrefHtmlEditorDefaultFontFamily: 'Arial',
				zimbraPrefHtmlEditorDefaultFontSize: '12pt',
				zimbraPrefHtmlEditorDefaultFontColor: '#000000'
			},
			attrs: {},
			props: []
		});
	});

	it('should replace a CID URL src with the matching download service URL', () => {
		createSoapAPIInterceptor('SaveDraft');
		const editor = generateNewMessageEditor();
		setupEditorStore({
			editors: [
				{
					...editor,
					isRichText: true,
					savedAttachments: [createInlineSavedAttachment()],
					text: {
						plainText: 'Body text',
						richText:
							'<p>Body text</p><img src="cid:abc123@carbonio" alt="Inline attachment" data-pnsrc="cid:abc123@carbonio" />'
					}
				}
			]
		});

		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		const { richText } = lastValue();
		// DOMParser#innerHTML encodes '&' as '&amp;' in attribute values.
		expect(richText).toContain('/service/home/~/?auth=co&amp;id=100&amp;part=2');

		/* eslint-disable testing-library/no-node-access */
		const parsedImages = new DOMParser()
			.parseFromString(richText, 'text/html')
			.querySelectorAll('img');
		/* eslint-enable testing-library/no-node-access */
		parsedImages.forEach((img) => {
			expect(img.getAttribute('src')).not.toMatch(/^cid:/);
		});
	});

	it('should preserve the CID reference so the message serialises correctly for sending', () => {
		createSoapAPIInterceptor('SaveDraft');
		const editor = generateNewMessageEditor();
		setupEditorStore({
			editors: [
				{
					...editor,
					isRichText: true,
					savedAttachments: [createInlineSavedAttachment()],
					text: {
						plainText: '',
						richText: '<img src="cid:abc123@carbonio" data-pnsrc="cid:abc123@carbonio" alt="img" />'
					}
				}
			]
		});

		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		// pnsrc keeps the CID so the save flow can convert the service URL back to cid:
		expect(lastValue().richText).toContain('pnsrc="cid:abc123@carbonio"');
	});

	it('should replace CID URLs for multiple inline images in the same body', () => {
		createSoapAPIInterceptor('SaveDraft');
		const editor = generateNewMessageEditor();
		setupEditorStore({
			editors: [
				{
					...editor,
					isRichText: true,
					savedAttachments: [
						createInlineSavedAttachment({
							contentId: 'img1@carbonio',
							messageId: '200',
							partName: '2'
						}),
						createInlineSavedAttachment({
							contentId: 'img2@carbonio',
							messageId: '200',
							partName: '3'
						})
					],
					text: {
						plainText: '',
						richText:
							'<img src="cid:img1@carbonio" alt="first" /><img src="cid:img2@carbonio" alt="second" />'
					}
				}
			]
		});

		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		const { richText } = lastValue();
		expect(richText).toContain('id=200&amp;part=2');
		expect(richText).toContain('id=200&amp;part=3');
	});

	it('should leave non-CID image URLs unchanged', () => {
		createSoapAPIInterceptor('SaveDraft');
		const editor = generateNewMessageEditor();
		const externalUrl = 'https://example.com/image.png';
		setupEditorStore({
			editors: [
				{
					...editor,
					isRichText: true,
					savedAttachments: [],
					text: { plainText: '', richText: `<img src="${externalUrl}" alt="external" />` }
				}
			]
		});

		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		expect(lastValue().richText).toContain(externalUrl);
	});

	it('should fall back to the original CID URL when no saved attachment matches it', () => {
		createSoapAPIInterceptor('SaveDraft');
		const editor = generateNewMessageEditor();
		const cidUrl = 'cid:unknown@carbonio';
		setupEditorStore({
			editors: [
				{
					...editor,
					isRichText: true,
					savedAttachments: [],
					text: { plainText: '', richText: `<img src="${cidUrl}" alt="img" />` }
				}
			]
		});

		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		expect(lastValue().richText).toContain(cidUrl);
	});

	it('should update the value when the body changes externally (e.g. identity change)', () => {
		createSoapAPIInterceptor('SaveDraft');
		const editor = generateNewMessageEditor();
		setupEditorStore({
			editors: [
				{
					...editor,
					isRichText: true,
					savedAttachments: [createInlineSavedAttachment()],
					text: { plainText: '', richText: '<p>empty</p>' }
				}
			]
		});

		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		setStoreText(
			editor.id,
			'<p>Body text</p><img src="cid:abc123@carbonio" data-pnsrc="cid:abc123@carbonio" alt="img" />',
			'Body text'
		);

		const { richText } = lastValue();
		expect(richText).toContain('/service/home/~/?auth=co&amp;id=100&amp;part=2');
		expect(richText).toContain('Body text');
	});
});
