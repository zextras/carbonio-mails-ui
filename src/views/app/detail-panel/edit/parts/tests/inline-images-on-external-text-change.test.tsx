/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';

import { RichTextEditorContainer } from '../rich-text-editor-container';
import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { SavedAttachment } from 'types/attachments';
import { EditorTextProvider } from 'types/editor';

/*
 * Spy functions used to intercept TinyMCE Editor method calls and the
 * initialValue prop received by the Composer. They are defined via vi.hoisted
 * so they are available inside the vi.mock factory (which is hoisted at the
 * top of the module by Vitest).
 */
const mockSetContent = vi.hoisted(() => vi.fn());
const mockGetContent = vi.hoisted(() => vi.fn(() => '<p></p>'));
const mockEditorOn = vi.hoisted(() => vi.fn());
const mockEditorDispatch = vi.hoisted(() => vi.fn());
const mockEditorSetDirty = vi.hoisted(() => vi.fn());
/** Captures the initialValue prop that was passed to Composer on each mount. */
const capturedInitialValues = vi.hoisted(() => [] as string[]);

/**
 * Build a minimal TinyMCE Editor stub whose setContent / getContent are
 * tracked with the module-level spies above.
 */
const createMockTinyMCEEditor = vi.hoisted(
	(): (() => import('tinymce').Editor) => () =>
		({
			setContent: mockSetContent,
			getContent: mockGetContent,
			on: mockEditorOn,
			dispatch: mockEditorDispatch,
			setDirty: mockEditorSetDirty
		}) as unknown as import('tinymce').Editor
);

/**
 * Replace the real Composer (TinyMCE wrapper) with a lightweight stub.
 * On mount (useEffect) it calls the `init_instance_callback` from the
 * options passed by RichTextEditorContainer, using the mock TinyMCE editor
 * above. This lets us verify which content is passed to editor.setContent()
 * without spinning up a real TinyMCE instance.
 */
// noinspection JSUnusedGlobalSymbols
vi.mock('@zextras/carbonio-ui-text-composer', async () => {
	const { useEffect } = await import('react');
	return {
		Composer: ({
			initialValue: composerInitialValue,
			customInitOptions
		}: {
			initialValue?: string;
			customInitOptions?: {
				init_instance_callback?: (editor: unknown) => unknown;
			};
		}): React.JSX.Element => {
			// Capture the initialValue passed by RichTextEditorContainer so tests
			// can assert it was pre-processed (CID URLs replaced with service URLs).
			capturedInitialValues.push(composerInitialValue ?? '');

			// Store reference to options so the effect closure captures the
			// version from the first render (stable after mount).
			const optionsRef = { current: customInitOptions };
			useEffect(() => {
				optionsRef.current?.init_instance_callback?.(createMockTinyMCEEditor());
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, []);
			return <div data-testid="mock-composer" />;
		}
	};
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Wait until RichTextEditorContainer has registered its textProvider in the store. */
const waitForTextProvider = (editorId: string): Promise<EditorTextProvider> =>
	waitFor(() => {
		const tp = useEditorsStore.getState().editors[editorId]?.textProvider;
		expect(tp).toBeDefined();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return tp!;
	});

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe('RichTextEditorContainer - inline image display', () => {
	beforeEach(() => {
		// Reset the captured initialValues before each test
		capturedInitialValues.length = 0;
		// Provide the minimum user settings used by RichTextEditorContainer
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

	// -------------------------------------------------------------------------
	// Inline images on external text changes (identity / signature change)
	// -------------------------------------------------------------------------

	describe('when the body is updated externally (e.g. identity change)', () => {
		it('should replace a CID URL src with the matching download service URL', async () => {
			createSoapAPIInterceptor('SaveDraft');

			const savedAttachment = createInlineSavedAttachment();
			const editor = generateNewMessageEditor();
			setupEditorStore({
				editors: [{ ...editor, isRichText: true, savedAttachments: [savedAttachment] }]
			});

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			const textProvider = await waitForTextProvider(editor.id);

			const htmlWithCid =
				'<p>Body text</p>' +
				'<img src="cid:abc123@carbonio" alt="Inline attachment" data-pnsrc="cid:abc123@carbonio" />';

			await act(async () => {
				// eslint-disable-next-line testing-library/await-async-utils
				textProvider.setCurrentText({ richText: htmlWithCid, plainText: 'Body text' });
			});

			// DOMParser#innerHTML encodes '&' as '&amp;' in attribute values, so the
			// expected URL has HTML-entity-encoded ampersands.
			const expectedServiceUrl = '/service/home/~/?auth=co&amp;id=100&amp;part=2';
			const calledWithHtml: string = mockSetContent.mock.lastCall?.[0] ?? '';
			expect(calledWithHtml).toContain(expectedServiceUrl);

			// Parse the output HTML and verify the img src attribute specifically
			// (not data-src / data-mce-src / pnsrc which legitimately keep the CID).
			/* eslint-disable testing-library/no-node-access */
			const parsedImages = new DOMParser()
				.parseFromString(calledWithHtml, 'text/html')
				.querySelectorAll('img');
			/* eslint-enable testing-library/no-node-access */
			parsedImages.forEach((img) => {
				expect(img.getAttribute('src')).not.toMatch(/^cid:/);
			});
		});

		it('should preserve data-mce-src with the CID URL so TinyMCE serialises correctly for sending', async () => {
			createSoapAPIInterceptor('SaveDraft');

			const savedAttachment = createInlineSavedAttachment();
			const editor = generateNewMessageEditor();
			setupEditorStore({
				editors: [{ ...editor, isRichText: true, savedAttachments: [savedAttachment] }]
			});

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			const textProvider = await waitForTextProvider(editor.id);

			const htmlWithCid =
				'<img src="cid:abc123@carbonio" data-pnsrc="cid:abc123@carbonio" alt="img" />';

			await act(async () => {
				// eslint-disable-next-line testing-library/await-async-utils
				textProvider.setCurrentText({ richText: htmlWithCid, plainText: '' });
			});

			// replaceCidUrlWithServiceUrl re-sets data-mce-src to the CID so TinyMCE uses
			// it when getContent() is called (e.g. before sending the message).
			const calledWithHtml: string = mockSetContent.mock.lastCall?.[0] ?? '';
			expect(calledWithHtml).toContain('data-mce-src="cid:abc123@carbonio"');
		});

		it('should replace CID URLs for multiple inline images in the same body', async () => {
			createSoapAPIInterceptor('SaveDraft');

			const attachment1 = createInlineSavedAttachment({
				contentId: 'img1@carbonio',
				messageId: '200',
				partName: '2'
			});
			const attachment2 = createInlineSavedAttachment({
				contentId: 'img2@carbonio',
				messageId: '200',
				partName: '3'
			});
			const editor = generateNewMessageEditor();
			setupEditorStore({
				editors: [
					{
						...editor,
						isRichText: true,
						savedAttachments: [attachment1, attachment2]
					}
				]
			});

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			const textProvider = await waitForTextProvider(editor.id);

			const htmlWithMultipleCids =
				'<img src="cid:img1@carbonio" alt="first" />' +
				'<img src="cid:img2@carbonio" alt="second" />';

			await act(async () => {
				// eslint-disable-next-line testing-library/await-async-utils
				textProvider.setCurrentText({ richText: htmlWithMultipleCids, plainText: '' });
			});

			const calledWithHtml: string = mockSetContent.mock.lastCall?.[0] ?? '';
			// DOMParser#innerHTML encodes '&' as '&amp;' in attribute values
			expect(calledWithHtml).toContain('id=200&amp;part=2');
			expect(calledWithHtml).toContain('id=200&amp;part=3');

			// Verify neither image has a CID URL as its src attribute
			/* eslint-disable testing-library/no-node-access */
			const parsedImages = new DOMParser()
				.parseFromString(calledWithHtml, 'text/html')
				.querySelectorAll('img');
			/* eslint-enable testing-library/no-node-access */
			parsedImages.forEach((img) => {
				expect(img.getAttribute('src')).not.toMatch(/^cid:/);
			});
		});

		it('should leave non-CID image URLs unchanged', async () => {
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [{ ...editor, isRichText: true, savedAttachments: [] }] });

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			const textProvider = await waitForTextProvider(editor.id);

			const externalUrl = 'https://example.com/image.png';
			const htmlWithExternalImage = `<img src="${externalUrl}" alt="external" />`;

			await act(async () => {
				// eslint-disable-next-line testing-library/await-async-utils
				textProvider.setCurrentText({ richText: htmlWithExternalImage, plainText: '' });
			});

			const calledWithHtml: string = mockSetContent.mock.lastCall?.[0] ?? '';
			expect(calledWithHtml).toContain(externalUrl);
		});

		it('should fall back to the original CID URL when no saved attachment matches it', async () => {
			createSoapAPIInterceptor('SaveDraft');

			// No saved attachments – nothing can be resolved
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [{ ...editor, isRichText: true, savedAttachments: [] }] });

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			const textProvider = await waitForTextProvider(editor.id);

			const cidUrl = 'cid:unknown@carbonio';
			const htmlWithUnknownCid = `<img src="${cidUrl}" alt="img" />`;

			await act(async () => {
				// eslint-disable-next-line testing-library/await-async-utils
				textProvider.setCurrentText({ richText: htmlWithUnknownCid, plainText: '' });
			});

			// No matching attachment → src stays as-is (replaceCidUrlWithServiceUrl is a no-op)
			const calledWithHtml: string = mockSetContent.mock.lastCall?.[0] ?? '';
			expect(calledWithHtml).toContain(cidUrl);
		});

		it('should pass through body text that contains no images', async () => {
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [{ ...editor, isRichText: true, savedAttachments: [] }] });

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			const textProvider = await waitForTextProvider(editor.id);

			const plainHtml = '<p>Hello World</p><p>No images here.</p>';

			await act(async () => {
				// eslint-disable-next-line testing-library/await-async-utils
				textProvider.setCurrentText({ richText: plainHtml, plainText: 'Hello World' });
			});

			// editor.setContent should have been called at least once
			expect(mockSetContent).toHaveBeenCalled();
			// The text content must be preserved
			const calledWithHtml: string = mockSetContent.mock.lastCall?.[0] ?? '';
			expect(calledWithHtml).toContain('Hello World');
		});
	});

	// -------------------------------------------------------------------------
	// Inline images on composer mount (send error / undo-send re-opens board)
	// -------------------------------------------------------------------------

	describe('when the composer mounts with stored draft content containing CID URLs', () => {
		it('should replace CID URL src with the service URL in the initialValue passed to Composer', () => {
			createSoapAPIInterceptor('SaveDraft');

			const savedAttachment = createInlineSavedAttachment();
			const editor = generateNewMessageEditor();
			// Simulate what the store looks like after a previous TinyMCE session: the
			// saved richText has src="cid:..." because getContent() serialises via
			// data-mce-src.
			const richTextWithCid =
				'<p>Body</p>' +
				'<img src="cid:abc123@carbonio" data-pnsrc="cid:abc123@carbonio" alt="img" />';
			setupEditorStore({
				editors: [
					{
						...editor,
						isRichText: true,
						savedAttachments: [savedAttachment],
						text: { plainText: 'Body', richText: richTextWithCid }
					}
				]
			});

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			// The Composer should have been called with a pre-processed initialValue
			// where the CID URL was replaced with the download service URL.
			expect(capturedInitialValues.length).toBeGreaterThanOrEqual(1);
			// All renders should receive the same pre-processed initialValue.
			const passedInitialValue = capturedInitialValues[0];

			// DOMParser#innerHTML encodes '&' as '&amp;' in attribute values
			expect(passedInitialValue).toContain('/service/home/~/?auth=co&amp;id=100&amp;part=2');

			// Verify the img src is not a CID URL any more
			/* eslint-disable testing-library/no-node-access */
			const parsedImages = new DOMParser()
				.parseFromString(passedInitialValue, 'text/html')
				.querySelectorAll('img');
			/* eslint-enable testing-library/no-node-access */
			parsedImages.forEach((img) => {
				expect(img.getAttribute('src')).not.toMatch(/^cid:/);
			});
		});

		it('should preserve data-mce-src with the CID URL in the initialValue', () => {
			createSoapAPIInterceptor('SaveDraft');

			const savedAttachment = createInlineSavedAttachment();
			const editor = generateNewMessageEditor();
			const richTextWithCid =
				'<img src="cid:abc123@carbonio" data-pnsrc="cid:abc123@carbonio" alt="img" />';
			setupEditorStore({
				editors: [
					{
						...editor,
						isRichText: true,
						savedAttachments: [savedAttachment],
						text: { plainText: '', richText: richTextWithCid }
					}
				]
			});

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			const passedInitialValue = capturedInitialValues[0] ?? '';
			// data-mce-src must still carry the CID so TinyMCE serialises correctly
			expect(passedInitialValue).toContain('data-mce-src="cid:abc123@carbonio"');
		});

		it('should leave the initialValue unchanged when there are no inline images', () => {
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateNewMessageEditor();
			const plainHtml = '<p>Hello World</p>';
			setupEditorStore({
				editors: [
					{
						...editor,
						isRichText: true,
						savedAttachments: [],
						text: { plainText: 'Hello World', richText: plainHtml }
					}
				]
			});

			setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

			expect(capturedInitialValues[0]).toContain('Hello World');
		});
	});
});
