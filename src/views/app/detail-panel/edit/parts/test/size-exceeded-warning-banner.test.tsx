/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';

import { generateSettings } from '../../../../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor, useEditorsStore } from '../../../../../../store/editor';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../../../../tests/generators/editors';
import { MailsEditorV2 } from '../../../../../../types';
import { calculateMailSize, SizeExceededWarningBanner } from '../size-exceeded-waring-banner';

describe('sizeExceededWarningBanner', () => {
	beforeEach(() => {
		const settings = generateSettings({
			attrs: {
				zimbraMtaMaxMessageSize: 100
			}
		});
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
	});

	it('render warning banner when the mail size exceeds limit', async () => {
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1);
		editor.size = 200;
		addEditor({ id: editor.id, editor });

		const setIsMailSizeWarningSpy = jest.fn();
		setupTest(
			<SizeExceededWarningBanner
				editorId={editor.id}
				isMailSizeWarning={false}
				setIsMailSizeWarning={setIsMailSizeWarningSpy}
			/>,
			{}
		);

		expect(setIsMailSizeWarningSpy).toHaveBeenCalledWith(true);
	});

	it('does not render warning banner when the mail size does not exceed limit', async () => {
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1);
		editor.size = 10;
		addEditor({ id: editor.id, editor });

		const setIsMailSizeWarningSpy = jest.fn();

		setupTest(
			<SizeExceededWarningBanner
				editorId={editor.id}
				isMailSizeWarning
				setIsMailSizeWarning={setIsMailSizeWarningSpy}
			/>
		);

		expect(setIsMailSizeWarningSpy).toHaveBeenCalledWith(false);
	});

	it('does not render a warning banner when a smartLink is marked for convertion', async () => {
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1);
		editor.size = 200;
		editor.totalSmartLinksSize = 150;
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

	it('toggling smartlink flag toggles the banner', async () => {
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1);
		editor.size = 200;
		editor.totalSmartLinksSize = 0;
		addEditor({ id: editor.id, editor });

		const setIsMailSizeWarningSpy = jest.fn();

		const { rerender } = setupTest(
			<SizeExceededWarningBanner
				editorId={editor.id}
				isMailSizeWarning
				setIsMailSizeWarning={setIsMailSizeWarningSpy}
			/>
		);

		expect(setIsMailSizeWarningSpy).toHaveBeenCalledWith(true);

		act(() => {
			useEditorsStore.setState({
				editors: { [editor.id]: { ...editor, totalSmartLinksSize: 150 } }
			});
		});

		const setIsMailSizeWarningSpy2 = jest.fn();
		rerender(
			<SizeExceededWarningBanner
				editorId={editor.id}
				isMailSizeWarning
				setIsMailSizeWarning={setIsMailSizeWarningSpy2}
			/>
		);

		expect(setIsMailSizeWarningSpy2).toHaveBeenCalledWith(false);

		act(() => {
			useEditorsStore.setState({
				editors: { [editor.id]: { ...editor, totalSmartLinksSize: 0 } }
			});
		});

		const setIsMailSizeWarningSpy3 = jest.fn();
		rerender(
			<SizeExceededWarningBanner
				editorId={editor.id}
				isMailSizeWarning={false}
				setIsMailSizeWarning={setIsMailSizeWarningSpy3}
			/>
		);

		expect(setIsMailSizeWarningSpy3).toHaveBeenCalledWith(true);
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
