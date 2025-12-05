// noinspection HtmlRequiredAltAttribute

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { RichTextEditorContainer } from '../rich-text-editor-container';
import { setupTest, screen } from '@test-setup';
import { handleEditorPaste } from 'views/app/detail-panel/edit/parts/editor-paste-handler';

vi.mock('views/app/detail-panel/edit/parts/editor-paste-handler', () => ({
	handleEditorPaste: vi.fn()
}));

let editorInstance: any = null;

const MockComposer: React.FC<any> = (props) => {
	React.useEffect(() => {
		const handlers: Record<string, ((evt?: any) => void)[]> = {};

		editorInstance = {
			html: '',
			on: (event: string, cb: (evt?: any) => void): void => {
				if (!handlers[event]) handlers[event] = [];
				handlers[event].push(cb);
			},
			dispatch: (event: string, evt?: any): void => {
				(handlers[event] || []).forEach((cb) => cb(evt || { type: event }));
			},
			getContent: ({ format }: { format: 'html' | 'text' }) =>
				format === 'html' ? editorInstance.html : editorInstance.html.replace(/<[^>]+>/g, ''),
			setContent: (html: string): void => {
				editorInstance.html = html;
			},
			hasFocus: vi.fn(() => true),
			setDirty: vi.fn(),
			focus: vi.fn(),
			dispatchEvent: vi.fn()
		};

		if (props.customInitOptions?.init_instance_callback) {
			props.customInitOptions.init_instance_callback(editorInstance);
		}

		return () => {
			editorInstance = null;
		};
	}, [props.customInitOptions]);

	return <div data-testid="mock-composer" />;
};

vi.mock('@zextras/carbonio-ui-text-composer', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-text-composer')),
	Composer: (props: any): any => <MockComposer {...props} />
}));

const mockRemoveInlineAttachments = vi.fn();
const mockSetText = vi.fn();
const mockSetTextProvider = vi.fn();

vi.mock('store/editor/index', () => ({
	useEditorText: vi.fn(() => ({
		getText: vi.fn(() => ({ plainText: '', richText: '' })),
		setText: mockSetText
	})),
	useEditorTextProvider: vi.fn(() => ({ setTextProvider: mockSetTextProvider })),
	useEditorAttachments: vi.fn(() => ({
		addInlineAttachments: vi.fn(),
		removeInlineAttachments: mockRemoveInlineAttachments
	}))
}));

describe('RichTextEditorContainer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		editorInstance = null;
	});

	test('cleans up inline attachments that are no longer in content', async () => {
		setupTest(<RichTextEditorContainer editorId="editor-1" onDragOver={vi.fn()} />);
		await screen.findByTestId('mock-composer');

		editorInstance?.setContent(
			'<p><img pnsrc="cid:first" src="cid:first" />' +
				'<img src="cid:second" />' +
				'<img src="https://test.test/image.png" /></p>'
		);

		editorInstance?.dispatch('Change');

		expect(mockRemoveInlineAttachments).toHaveBeenCalledWith({});
	});

	test('handles paste event and restores scroll position', async () => {
		setupTest(<RichTextEditorContainer editorId="editor-1" onDragOver={vi.fn()} />);
		await screen.findByTestId('mock-composer');

		const editWrapper = document.createElement('div');
		editWrapper.dataset.testid = 'edit-view-editor';
		const parent = document.createElement('div');
		parent.scrollTop = 42;
		parent.appendChild(editWrapper);
		document.body.appendChild(parent);

		const event = {} as unknown as ClipboardEvent;

		editorInstance.dispatch('paste', event);

		expect(handleEditorPaste).toHaveBeenCalledWith(editorInstance, 'editor-1', event);
		expect(parent.scrollTop).toBe(42);
	});
});
