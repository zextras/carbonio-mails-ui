/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import { act } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';
import { times } from 'lodash';

import { screen, setupTest, within } from '../../../carbonio-ui-commons/test/test-setup';
import { TESTID_SELECTORS } from '../../../tests/constants';
import { buildSignature } from '../../../tests/generators/signatures';
import { handleGetSignaturesRequest } from '../../../tests/mocks/network/msw/handle-get-signatures';
import type { SignatureSettingsPropsType, SignItemType } from '../../../types';
import SignatureSettings from '../signature-settings';

const FIND_TIMEOUT = 2000;

const buildProps = ({
	updatedIdentities = [],
	updateIdentities = jest.fn(),
	setDisabled = jest.fn(),
	signatures = [],
	setSignatures = jest.fn(),
	setOriginalSignatures = jest.fn()
}: Partial<SignatureSettingsPropsType>): SignatureSettingsPropsType => ({
	updatedIdentities,
	updateIdentities,
	setDisabled,
	signatures,
	setSignatures,
	setOriginalSignatures
});

const SettingsViewMock = ({
	preloadedSignatures = []
}: {
	preloadedSignatures?: Array<SignItemType>;
}): React.JSX.Element => {
	const updatedIdentities = useMemo(() => [], []);
	const updateIdentities = useCallback(() => jest.fn(), []);
	const setDisabled = useCallback(() => jest.fn(), []);
	const [, setOriginalSignatures] = useState<Array<SignItemType>>(preloadedSignatures);
	const [signatures, setSignatures] = useState<Array<SignItemType>>(preloadedSignatures);
	return (
		<SignatureSettings
			updatedIdentities={updatedIdentities}
			updateIdentities={updateIdentities}
			setDisabled={setDisabled}
			signatures={signatures}
			setSignatures={setSignatures}
			setOriginalSignatures={setOriginalSignatures}
		/>
	);
};

const mockEditor = (): jest.Mock => {
	const mockComponent = jest.fn().mockReturnValue(<></>);
	jest.spyOn(shell, 'useIntegratedComponent').mockReturnValue([mockComponent, true]);

	return mockComponent;
};

describe('Signature settings', () => {
	beforeAll(() => {
		handleGetSignaturesRequest([]);
	});
	it('should render the section title', () => {
		setupTest(<SignatureSettings {...buildProps({})} />);
		expect(screen.getByText('signatures.signature_heading')).toBeVisible();
	});

	it('should render the "add signature" button', () => {
		setupTest(<SignatureSettings {...buildProps({})} />);
		expect(screen.getByRole('button', { name: 'signatures.add_signature' })).toBeVisible();
	});

	it('should render the input field for the name of the signature', () => {
		setupTest(<SignatureSettings {...buildProps({})} />);
		const nameInput = screen.getByRole('textbox', { name: 'signatures.name' });
		expect(nameInput).toBeVisible();
	});

	it('should render the editor field for the content of the signature', () => {
		const editorMock = mockEditor();
		setupTest(<SignatureSettings {...buildProps({})} />);
		expect(editorMock).toHaveBeenCalledWith(
			expect.objectContaining({
				'data-testid': TESTID_SELECTORS.signatureEditor
			}),
			{}
		);
	});

	/*
	 * FIXME in the following tests the signatures list is set from outside the component, because otherwise tests are
	 *  going to fail when the loading of the signatures is performed by the API call instead.
	 */
	describe('Signatures list', () => {
		it.todo('should display an error if the request for the list of signatures fails');

		it('should render the list of signatures', async () => {
			const signatures: Array<SignItemType> = times(12, () => buildSignature({}));
			handleGetSignaturesRequest(signatures);
			setupTest(<SettingsViewMock preloadedSignatures={signatures} />);
			await screen.findByText(signatures[0].label, undefined, { timeout: FIND_TIMEOUT });

			signatures.forEach((signature) => {
				expect(screen.getByText(signature.label)).toBeVisible();
			});
		});

		it('should display a delete button when when user hover on the list item', async () => {
			const signature = buildSignature({});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.label, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);
			const listItem = await within(list).findByText(signature.label);
			await act(async () => {
				await user.hover(listItem);
			});
			const button = await screen.findByRole('button', { name: 'label.delete' });
			expect(button).toBeVisible();
		});

		it('should display the name and the content of the first signature', async () => {
			const mockedEditor = mockEditor();
			const signatures: Array<SignItemType> = [
				buildSignature({}),
				buildSignature({}),
				buildSignature({})
			];
			handleGetSignaturesRequest(signatures);
			setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signatures[0].name, undefined, { timeout: FIND_TIMEOUT });

			const nameInput = screen.getByRole('textbox', { name: 'signatures.name' });
			expect(nameInput).toHaveValue(signatures[0].name);
			expect(mockedEditor).toHaveBeenLastCalledWith(
				expect.objectContaining({
					'data-testid': TESTID_SELECTORS.signatureEditor,
					value: signatures[0].description
				}),
				{}
			);
		});

		it('should display the name and the content of the clicked signature', async () => {
			const mockedEditor = mockEditor();
			const signatures: Array<SignItemType> = [
				buildSignature({}),
				buildSignature({}),
				buildSignature({})
			];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signatures[0].name, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);
			const listItem = await within(list).findByText(signatures[1].name);
			await act(async () => {
				await user.click(listItem);
			});

			const nameInput = screen.getByRole('textbox', { name: 'signatures.name' });
			expect(nameInput).toHaveValue(signatures[1].name);
			expect(mockedEditor).toHaveBeenLastCalledWith(
				expect.objectContaining({
					'data-testid': TESTID_SELECTORS.signatureEditor,
					value: signatures[1].description
				}),
				{}
			);
		});

		it('should remove the signature from the list if the remove button is clicked', async () => {
			const signature = buildSignature({});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);
			const listItem = await within(list).findByText(signature.name);
			await act(async () => {
				await user.hover(listItem);
			});

			await act(async () => {
				await user.click(screen.getByRole('button', { name: 'label.delete' }));
			});

			expect(within(list).queryByText(signature.label)).not.toBeInTheDocument();
		});

		it('should reset the signature name and the content fields if the remove button is clicked and there are no other signatures', async () => {
			const mockedEditor = mockEditor();
			const signature = buildSignature({});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);
			const listItem = await within(list).findByText(signature.name);
			await act(async () => {
				await user.hover(listItem);
			});

			await act(async () => {
				await user.click(screen.getByRole('button', { name: 'label.delete' }));
			});

			expect(screen.getByRole('textbox', { name: 'signatures.name' })).not.toHaveValue(
				signature.name
			);
			expect(mockedEditor).toHaveBeenLastCalledWith(
				expect.not.objectContaining({
					value: signature.description
				}),
				{}
			);
		});

		it.todo(
			'should reset the signature name and the content fields if, after the editing of a new signature, the remove button is clicked and there are no other signatures'
		);

		it.todo(
			'should select the previous signature if the remove button is clicked on the selected signature'
		);

		it.todo(
			'should leave the current selected signature if the remove button is clicked on another signature'
		);

		it.todo(
			'should disable the signature name and content fields if the remove button is clicked and there are not other signatures'
		);

		it('should add a new signature to the list if the "add signature" button is clicked', async () => {
			const oldSignature = buildSignature({});
			handleGetSignaturesRequest([oldSignature]);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={[oldSignature]} />);

			await screen.findByText(oldSignature.name, undefined, { timeout: FIND_TIMEOUT });

			await act(async () => {
				await user.click(screen.getByRole('button', { name: 'signatures.add_signature' }));
			});

			expect(screen.getByText('label.enter_name')).toBeVisible();
		});

		it('should select the new signature', async () => {
			const oldSignature = buildSignature({});
			handleGetSignaturesRequest([oldSignature]);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={[oldSignature]} />);

			act(() => {
				jest.advanceTimersByTime(30000);
			});

			await screen.findByText(oldSignature.name, undefined, { timeout: FIND_TIMEOUT });

			await act(async () => {
				await user.click(screen.getByRole('button', { name: 'signatures.add_signature' }));
			});

			expect(screen.getByText('label.enter_name')).toBeVisible();
		});
	});

	it('should disable the signature name input field if no signature is currently selected', () => {
		setupTest(<SignatureSettings {...buildProps({})} />);
		const nameInput = screen.getByRole('textbox', { name: 'signatures.name' });
		expect(nameInput).toBeDisabled();
	});

	it('should disable the signature content editor if no signature is currently selected', () => {
		const mockedEditor = mockEditor();
		setupTest(<SignatureSettings {...buildProps({})} />);
		expect(mockedEditor).toHaveBeenCalledWith(
			expect.objectContaining({
				'data-testid': TESTID_SELECTORS.signatureEditor,
				disabled: true
			}),
			{}
		);
	});

	it('should enable the signature name input field if a signature is currently selected', () => {
		const signatures: Array<SignItemType> = [{ ...buildSignature({}) }];
		setupTest(<SignatureSettings {...buildProps({ signatures })} />);
		const nameInput = screen.getByRole('textbox', { name: 'signatures.name' });
		expect(nameInput).toBeEnabled();
	});

	it('should enable the signature content editor if a signature is currently selected', () => {
		const mockedEditor = mockEditor();
		const signatures: Array<SignItemType> = [{ ...buildSignature({}) }];
		setupTest(<SignatureSettings {...buildProps({ signatures })} />);
		expect(mockedEditor).toHaveBeenLastCalledWith(
			expect.not.objectContaining({
				disabled: true
			}),
			{}
		);
	});
});
