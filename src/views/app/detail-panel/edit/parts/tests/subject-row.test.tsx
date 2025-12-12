/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { getIntegratedFunction } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { addEditor } from 'store/editor/index';
import { setupEditorStore } from '__test__/generators/editor-store';
import { readyToBeSentEditorTestCase } from '__test__/generators/editors';
import { SubjectRow } from 'views/app/detail-panel/edit/parts/subject-row';

beforeEach(() => {
	createSoapAPIInterceptor('SaveDraft');
});

describe('SubjectRow', () => {
	it('Should display the subject', async () => {
		getIntegratedFunction.mockImplementation(() => [vi.fn(), true]);
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase({
			subject: 'test subject'
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const element = screen.getByTestId('subject');
		expect(element).toBeInTheDocument();
	});

	it('Should display the request read receipt icon when requestReadReceipt is true', async () => {
		getIntegratedFunction.mockImplementation(() => [vi.fn(), true]);
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase({
			requestReadReceipt: true
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const icon = screen.getByTestId('request-receipt-icon');
		expect(icon).toBeVisible();
	});

	it('Should display the urgent icon when isUrgent is true', async () => {
		getIntegratedFunction.mockImplementation(() => [vi.fn(), true]);
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase({
			isUrgent: true
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const icon = screen.getByTestId('mark-important-icon');
		expect(icon).toBeVisible();
	});

	it('Should display the S/MIME sign icon when isSmimeSign is true', async () => {
		getIntegratedFunction.mockImplementation(() => [vi.fn(), true]);
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase({
			isSmimeSign: true
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const icon = screen.getByTestId('use-certificate-icon');
		expect(icon).toBeVisible();
	});

	it('Should display the S/MIME encrypt icon when isSmimeEncrypt is true', async () => {
		getIntegratedFunction.mockImplementation(() => [vi.fn(), true]);
		setupEditorStore({ editors: [] });
		const editor = await readyToBeSentEditorTestCase({
			isSmimeEncrypt: true
		});
		addEditor({ id: editor.id, editor });
		setupTest(<SubjectRow editorId={editor.id} />);
		const icon = screen.getByTestId('use-encrypt-sign-icon');
		expect(icon).toBeVisible();
	});
});
