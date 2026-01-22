/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { setupEditorStore } from '__test__/generators/editor-store';
import {
	OptionsDropdown,
	OptionsDropdownProps
} from 'views/app/detail-panel/edit/parts/options-dropdown';

const OPTION_DROPDOWN_ICON = 'options-dropdown-icon';
const DROPDOWN_POPPER_LIST = 'dropdown-popper-list';

describe('OptionsDropdown', () => {
	const renderComponent = (isSmimeEnabled = true): ReturnType<typeof setupTest> => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const defaultProps: OptionsDropdownProps = {
			editorId: editor.id,
			onSmimeOptionChange: vi.fn(),
			onSmimeEncryptOptionChange: vi.fn(),
			isSmimeEnabled
		};
		return setupTest(<OptionsDropdown {...defaultProps}></OptionsDropdown>);
	};

	it('Should renders all dropdown options', async () => {
		const { user } = renderComponent();

		const dropdownIcon = screen.getByTestId(OPTION_DROPDOWN_ICON);
		expect(dropdownIcon).toBeVisible();
		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();

		expect(screen.getByText(/tooltip\.enable_rich_text/i)).toBeVisible();
		expect(screen.getByText(/label\.mark_as_important/i)).toBeVisible();
		expect(screen.getByText(/composer\.uploadCertificate\.useCertificateToSign/i)).toBeVisible();
		expect(screen.getByText(/composer\.uploadCertificate\.useCertificateToEncrypt/i)).toBeVisible();
		expect(screen.getByText(/label\.request_receipt/i)).toBeVisible();
	});

	it('Should change all dropdown options', async () => {
		const { user } = renderComponent();

		const dropdownIcon = screen.getByTestId(OPTION_DROPDOWN_ICON);
		expect(dropdownIcon).toBeVisible();
		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();

		expect(screen.getByText(/tooltip\.enable_rich_text/i)).toBeVisible();
		await user.click(screen.getByText(/tooltip\.enable_rich_text/i));

		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();
		expect(screen.getByText(/tooltip\.disable_rich_text/i)).toBeVisible();
	});

	it(`Should dispaly 'Disable rich text' option on select of 'Enble rich text'`, async () => {
		const { user } = renderComponent();

		const dropdownIcon = screen.getByTestId(OPTION_DROPDOWN_ICON);
		expect(dropdownIcon).toBeVisible();
		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();

		expect(screen.getByText(/tooltip\.enable_rich_text/i)).toBeVisible();
		await user.click(screen.getByText(/tooltip\.enable_rich_text/i));

		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();
		expect(screen.getByText(/tooltip\.disable_rich_text/i)).toBeVisible();
	});

	it(`Should dispaly 'Mark as unimportant' option on select of 'Mark as important'`, async () => {
		const { user } = renderComponent();

		const dropdownIcon = screen.getByTestId(OPTION_DROPDOWN_ICON);
		expect(dropdownIcon).toBeVisible();
		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();

		expect(screen.getByText(/label\.mark_as_important/i)).toBeVisible();
		await user.click(screen.getByText(/label\.mark_as_important/i));

		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();
		expect(screen.getByText(/label\.mark_as_un_important/i)).toBeVisible();
	});

	it(`Should dispaly 'Remove read receipt request' option on select of 'Request read receipt'`, async () => {
		const { user } = renderComponent();

		const dropdownIcon = screen.getByTestId(OPTION_DROPDOWN_ICON);
		expect(dropdownIcon).toBeVisible();
		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();

		expect(screen.getByText(/label\.request_receipt/i)).toBeVisible();
		await user.click(screen.getByText(/label\.request_receipt/i));

		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();
		expect(screen.getByText(/label.remove_request_receipt/i)).toBeVisible();
	});

	it('Should not display the SMIME options when isSmimeEnabled is false', async () => {
		const { user } = renderComponent(false);

		const dropdownIcon = screen.getByTestId(OPTION_DROPDOWN_ICON);
		expect(dropdownIcon).toBeVisible();
		await act(() => user.click(dropdownIcon));
		expect(screen.getByTestId(DROPDOWN_POPPER_LIST)).toBeInTheDocument();

		expect(
			screen.queryByText('composer.uploadCertificate.useCertificateToSign')
		).not.toBeInTheDocument();
		expect(
			screen.queryByText('composer.uploadCertificate.useCertificateToEncrypt')
		).not.toBeInTheDocument();
	});
});
