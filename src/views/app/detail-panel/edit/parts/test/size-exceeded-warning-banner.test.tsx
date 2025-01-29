/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { noop } from 'lodash';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor } from '../../../../../../store/editor';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../../../../tests/generators/editors';
import { MailsEditorV2 } from '../../../../../../types';
import { calculateMailSize, SizeExceededWarningBanner } from '../size-exceeded-waring-banner';

const ERROR_MSG_EXCEED_LIMIT =
	'The message size exceeds the limit. Please convert some attachments to smart links.';

describe('sizeExceededWarningBanner', () => {
	describe('sizeExceededWarningBanner', () => {
		it('render warning banner when the mail size exceeds limit', async () => {
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1);
			editor.size = 999999999;
			addEditor({ id: editor.id, editor });

			const { getByText } = setupTest(
				<SizeExceededWarningBanner
					editorId={editor.id}
					isMailSizeWarning
					setIsMailSizeWarning={noop}
				/>,
				{}
			);
			expect(getByText(ERROR_MSG_EXCEED_LIMIT)).toBeInTheDocument();
		});

		it('does not render warning banner when the mail size does not exceed limit', async () => {
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1);
			editor.size = 0;
			addEditor({ id: editor.id, editor });

			const { queryByText } = setupTest(
				<SizeExceededWarningBanner
					editorId={editor.id}
					isMailSizeWarning={false}
					setIsMailSizeWarning={noop}
				/>
			);
			expect(queryByText(ERROR_MSG_EXCEED_LIMIT)).not.toBeInTheDocument();
		});

		it('renders warning banner when the total mail size (editor size + smart link size) exceeds limit', async () => {
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1);
			editor.size = 30_000_000;
			editor.totalSmartLinksSize = 600;
			addEditor({ id: editor.id, editor });

			const setIsMailSizeWarningSpy = jest.fn();

			setupTest(
				<SizeExceededWarningBanner
					editorId={editor.id}
					isMailSizeWarning
					setIsMailSizeWarning={setIsMailSizeWarningSpy}
				/>,
				{}
			);

			expect(setIsMailSizeWarningSpy).toHaveBeenCalledWith(true);
		});

		it('does not render warning banner when the total mail size (editor size + smart link size) does not exceed limit', async () => {
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1);
			editor.size = 30_000_000;
			editor.totalSmartLinksSize = 20_000_000;
			addEditor({ id: editor.id, editor });

			const setIsMailSizeWarningSpy = jest.fn();

			setupTest(
				<SizeExceededWarningBanner
					editorId={editor.id}
					isMailSizeWarning
					setIsMailSizeWarning={setIsMailSizeWarningSpy}
				/>,
				{}
			);

			expect(setIsMailSizeWarningSpy).toHaveBeenCalledWith(false);
		});
	});

	describe('calculateMailSize', () => {
		const generatedEditor = generateEditorV2Case(1);

		it('returns correct size when editor has size and totalSmartLinksSize', async () => {
			const editor: MailsEditorV2 = {
				...(await generatedEditor),
				size: 1000,
				totalSmartLinksSize: 200
			};
			expect(calculateMailSize(editor)).toBe(820);
		});

		it('returns correct size when editor size is zero', async () => {
			const editor: MailsEditorV2 = {
				...(await generatedEditor),
				size: 0,
				totalSmartLinksSize: 200
			};
			expect(calculateMailSize(editor)).toBe(-180);
		});

		it('returns correct size when totalSmartLinksSize is zero', async () => {
			const editor: MailsEditorV2 = {
				...(await generatedEditor),
				size: 1000,
				totalSmartLinksSize: 0
			};
			expect(calculateMailSize(editor)).toBe(1000);
		});

		it('returns correct size when editor is undefined', () => {
			expect(calculateMailSize(undefined as never)).toBe(0);
		});

		it('returns correct size when editor has undefined properties', async () => {
			const editor: MailsEditorV2 = {
				...(await generatedEditor),
				size: undefined as never,
				totalSmartLinksSize: undefined as never
			};
			expect(calculateMailSize(editor)).toBe(0);
		});
	});
});
