/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { getIntegratedFunction } from '../../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor } from '../../../../../../store/zustand/editor';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { readyToBeSentEditorTestCase } from '../../../../../../tests/generators/editors';
import { generateStore } from '../../../../../../tests/generators/store';
import { SubjectRow } from '../subject-row';

beforeEach(() => {
	createSoapAPIInterceptor('SaveDraft');
});

describe('SubjectRow', () => {
	it('Should display the subject', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			subject: 'test subject'
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const element = screen.getByTestId('subject');
		expect(element).toBeInTheDocument();
	});

	it('Should display the request read receipt icon when requestReadReceipt is true', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			requestReadReceipt: true
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const icon = screen.getByTestId('request-receipt-icon');
		expect(icon).toBeVisible();
	});

	it('Should display the urgent icon when isUrgent is true', async () => {
		const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			isUrgent: true
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const icon = screen.getByTestId('mark-important-icon');
		expect(icon).toBeVisible();
		consoleErrorMock.mockRestore();
	});

	it('Should display the S/MIME sign icon when isSmimeSign is true', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			isSmimeSign: true
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const icon = screen.getByTestId('use-certificate-icon');
		expect(icon).toBeVisible();
	});
});
