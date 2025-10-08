/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { useIntegratedComponent } from '@zextras/carbonio-shell-ui';

import { RichTextEditorContainer } from '../rich-text-editor-container';
import { setupTest, screen } from '@test-setup';

jest.mock('lodash', () => ({
	...jest.requireActual('lodash'),
	debounce: (fn: (...args: any[]) => any): any => fn,
	noop: (): void => {
		// empty noop
	}
}));

let editorInstance: any = null;

const mockRemoveInlineAttachments = jest.fn();
const MockComposer: React.FC<any> = (props) => {
	React.useEffect(() => {
		const handlers: Record<string, ((evt?: any) => void)[]> = {};

		editorInstance = {
			html: '',
			on: (event: string, cb: (evt?: any) => void): void => {
				if (!handlers[event]) handlers[event] = [];
				handlers[event].push(cb);
			},
			dispatch: (event: string): void => {
				(handlers[event] || []).forEach((cb) => cb({ type: event }));
			},
			getContent: ({ format }: { format: 'html' | 'text' }) =>
				format === 'html' ? editorInstance.html : editorInstance.html.replace(/<[^>]+>/g, ''),
			setContent: (html: string): void => {
				editorInstance.html = html;
			}
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

jest.mock('store/editor/index', () => ({
	useEditorText: jest.fn(() => ({
		getText: jest.fn(() => ({ plainText: '', richText: '' })),
		setText: jest.fn()
	})),
	useEditorTextProvider: jest.fn(() => ({ setTextProvider: jest.fn() })),
	useEditorAttachments: jest.fn(() => ({
		addInlineAttachments: jest.fn(),
		removeInlineAttachments: mockRemoveInlineAttachments
	}))
}));

(useIntegratedComponent as jest.Mock).mockImplementation(() => [MockComposer]);

describe('RichTextEditorContainer', () => {
	test('cleans up inline attachments that are no longer in content', async () => {
		setupTest(<RichTextEditorContainer editorId="editor-1" onDragOver={jest.fn()} />);

		await screen.findByTestId('mock-composer');

		editorInstance?.setContent(
			'<p><img pnsrc="cid:first" src="cid:first" />' +
				'<img src="cid:second" />' +
				'<img src="https://test.test/image.png" /></p>'
		);

		editorInstance?.dispatch('Change');

		expect(mockRemoveInlineAttachments).toHaveBeenCalledWith([
			'cid:first',
			'cid:first',
			'cid:second'
		]);
	});
});
