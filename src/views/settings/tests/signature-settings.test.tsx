/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import { within } from '@testing-library/react';
import { times } from 'lodash';

import { setupTest, screen } from '@test-setup';
import { handleGetSignaturesRequest } from '@test-utils/network/msw/handle-get-signatures';
import { TESTID_SELECTORS } from '__test__/constants';
import { buildSignature } from '__test__/generators/signatures';
import { SignatureSettingsPropsType, SignItemType } from 'types/settings';
import SignatureSettings from 'views/settings/signature-settings';

// noinspection JSUnusedGlobalSymbols
vi.mock('@zextras/carbonio-ui-text-composer', () => ({
	Composer: ({
		'data-testid': testId,
		value,
		onEditorChange,
		disabled
	}: {
		'data-testid': string;
		value: string;
		onEditorChange?: (values: [string, string]) => void;
		disabled?: boolean;
	}): React.JSX.Element => (
		<div data-testid={testId}>
			<textarea
				data-testid="signature-editor-textarea"
				value={value ?? ''}
				onChange={(e): void | undefined => onEditorChange?.([e.target.value, e.target.value])}
				disabled={disabled}
			/>
		</div>
	)
}));

const FIND_TIMEOUT = 2000;

const buildProps = ({
	updatedIdentities = [],
	updateIdentities = vi.fn(),
	setDisabled = vi.fn(),
	signatures = [],
	setSignatures = vi.fn()
}: Partial<SignatureSettingsPropsType>): SignatureSettingsPropsType => ({
	updatedIdentities,
	updateIdentities,
	setDisabled,
	signatures,
	setSignatures
});

const SettingsViewMock = ({
	preloadedSignatures = []
}: {
	preloadedSignatures?: Array<SignItemType>;
}): React.JSX.Element => {
	const updatedIdentities = useMemo(() => [], []);
	const updateIdentities = useCallback(() => vi.fn(), []);
	const setDisabled = useCallback(() => vi.fn(), []);
	const [signatures, setSignatures] = useState<Array<SignItemType>>(preloadedSignatures);
	return (
		<SignatureSettings
			updatedIdentities={updatedIdentities}
			updateIdentities={updateIdentities}
			setDisabled={setDisabled}
			signatures={signatures}
			setSignatures={setSignatures}
		/>
	);
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
		setupTest(<SignatureSettings {...buildProps({})} />);
		expect(screen.getByTestId(TESTID_SELECTORS.signatureEditor)).toBeVisible();
	});

	/*
	 * FIXME in the following tests the signatures list is set from outside the component, because otherwise tests are
	 *  going to fail when the loading of the signatures is performed by the API call instead.
	 */
	describe('Signatures list', () => {
		it.todo('should display an error if the request for the list of signatures fails');

		it('should render the list of signatures', async () => {
			const signatures: Array<SignItemType> = times(12, (i) =>
				buildSignature({ label: `Signature ${i}` })
			);
			handleGetSignaturesRequest(signatures);
			setupTest(<SettingsViewMock preloadedSignatures={signatures} />);
			await screen.findByText(signatures[0].label, undefined, { timeout: FIND_TIMEOUT });

			signatures.forEach((signature) => {
				expect(screen.getByText(signature.label)).toBeVisible();
			});
		});

		/*
		 * Set as "failing" because the actual visibility of the delete button cannot be tested
		 * with the current version of JSDOM.
		 * JSDOM does not support the `:hover` pseudo-class and it is impossible to simulate
		 * when the visibility is changed in a nested css selector.
		 */
		it.fails('should display a delete button when when user hover on the list item', async () => {
			const signature = buildSignature({});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.label, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);
			const listItem = await within(list).findByText(signature.label);
			await user.hover(listItem);
			const button = await screen.findByRole('button', { name: 'label.delete' });
			expect(button).toBeVisible();
		});

		it('should display the name and the content of the first signature', async () => {
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
			expect(screen.getByTestId('signature-editor-textarea')).toHaveValue(
				signatures[0].description
			);
		});

		it('should display the name and the content of the clicked signature', async () => {
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
			await user.click(listItem);

			const nameInput = screen.getByRole('textbox', { name: 'signatures.name' });
			expect(nameInput).toHaveValue(signatures[1].name);
			expect(screen.getByTestId('signature-editor-textarea')).toHaveValue(
				signatures[1].description
			);
		});

		it('should remove the signature from the list if the remove button is clicked', async () => {
			const signature = buildSignature({});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);

			await user.click(screen.getByTestId('delete-signature-button'));

			expect(within(list).queryByText(signature.label)).not.toBeInTheDocument();
		});

		it('should reset the signature name and the content fields if the remove button is clicked and there are no other signatures', async () => {
			const signature = buildSignature({});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);

			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });
			await user.click(screen.getByTestId('delete-signature-button'));
			expect(screen.getByRole('textbox', { name: 'signatures.name' })).not.toHaveValue(
				signature.name
			);

			expect(screen.getByTestId(TESTID_SELECTORS.signatureEditor)).not.toHaveValue(
				signature.description
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

			await user.click(screen.getByRole('button', { name: 'signatures.add_signature' }));

			expect(screen.getByText('label.enter_name')).toBeVisible();
		});

		it('should select the new signature', async () => {
			const oldSignature = buildSignature({});
			handleGetSignaturesRequest([oldSignature]);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={[oldSignature]} />);

			await screen.findByText(oldSignature.name, undefined, { timeout: FIND_TIMEOUT });

			await user.click(screen.getByRole('button', { name: 'signatures.add_signature' }));

			expect(screen.getByText('label.enter_name')).toBeVisible();
		});
	});

	describe('onSignatureContentChange', () => {
		it.todo('returns early if editor is not focused');

		it.todo('returns early if currentSignature is undefined');

		it.todo('returns early if description is unchanged');

		it.todo('updates signature and enables editing if description is changed');
	});

	it('should disable the signature content editor if no signature is currently selected', () => {
		setupTest(<SignatureSettings {...buildProps({})} />);
		expect(screen.getByTestId('signature-editor-textarea')).toBeDisabled();
	});

	it('should enable the signature name input field if a signature is currently selected', () => {
		const signatures: Array<SignItemType> = [{ ...buildSignature({}) }];
		setupTest(<SignatureSettings {...buildProps({ signatures })} />);
		const nameInput = screen.getByRole('textbox', { name: 'signatures.name' });
		expect(nameInput).toBeEnabled();
	});

	it('should enable the signature content editor if a signature is currently selected', () => {
		const signatures: Array<SignItemType> = [{ ...buildSignature({}) }];
		setupTest(<SignatureSettings {...buildProps({ signatures })} />);
		expect(screen.getByTestId(TESTID_SELECTORS.signatureEditor)).toBeEnabled();
	});
});
