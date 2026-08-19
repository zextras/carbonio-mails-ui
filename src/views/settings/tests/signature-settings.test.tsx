/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import { within } from '@testing-library/react';
import { times } from 'lodash';

import { setupTest, screen } from '@test-setup';
import { useLocalStorage } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { handleGetSignaturesRequest } from '@test-utils/network/msw/handle-get-signatures';
import { TESTID_SELECTORS } from '__test__/constants';
import { buildSignature } from '__test__/generators/signatures';
import { LOCAL_STORAGE_LEGACY_EDITOR } from 'constants/index';
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
				aria-label="Signature editor"
				value={value ?? ''}
				onChange={(e): void | undefined => onEditorChange?.([e.target.value, e.target.value])}
				disabled={disabled}
			/>
		</div>
	)
}));

const FIND_TIMEOUT = 2000;

const mockLegacyEditor = (useLegacy: boolean): void => {
	useLocalStorage.mockImplementation((key: string) =>
		key === LOCAL_STORAGE_LEGACY_EDITOR ? [useLegacy, vi.fn()] : [undefined, vi.fn()]
	);
};

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

	describe('when the new rich text editor is enabled', () => {
		beforeEach(() => {
			mockLegacyEditor(false);
		});

		it('should render the new editor instead of the legacy composer', () => {
			setupTest(<SignatureSettings {...buildProps({})} />);
			expect(screen.getByTestId(TESTID_SELECTORS.signatureEditor)).toBeVisible();
			expect(screen.queryByTestId('signature-editor-textarea')).not.toBeInTheDocument();
		});

		it('should display the content of the currently selected signature', async () => {
			const signature = buildSignature({});
			const description = signature.description ?? '';
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });

			const editor = screen.getByTestId(TESTID_SELECTORS.signatureEditor);
			await within(editor).findByText(description);
		});

		it('should update the signature description when the user types in the editor', async () => {
			const signature = buildSignature({});
			const description = signature.description ?? '';
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });

			const editor = screen.getByTestId(TESTID_SELECTORS.signatureEditor);
			const textNode = await within(editor).findByText(description);
			await user.click(textNode);
			await user.keyboard(' edited');

			await within(editor).findByText(`${description} edited`);
		});

		it('should show the content of the newly selected signature after editing and switching away from another one', async () => {
			const signatureA = buildSignature({
				label: 'Signature A',
				name: 'Signature A',
				content: [{ type: 'text/html', _content: 'content A' }]
			});
			const signatureB = buildSignature({
				label: 'Signature B',
				name: 'Signature B',
				content: [{ type: 'text/html', _content: 'content B' }]
			});
			const signatures: Array<SignItemType> = [signatureA, signatureB];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signatureA.name, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);
			const editor = screen.getByTestId(TESTID_SELECTORS.signatureEditor);

			const textA = await within(editor).findByText('content A');
			await user.click(textA);
			await user.keyboard(' edited');
			await within(editor).findByText('content A edited');

			await user.click(await within(list).findByText(signatureB.name));
			await within(editor).findByText('content B');
			expect(within(editor).queryByText(/content A/)).not.toBeInTheDocument();

			await user.click(await within(list).findByText(signatureA.name));
			await within(editor).findByText('content A edited');
			expect(within(editor).queryByText('content B')).not.toBeInTheDocument();
		});

		it('should disable the signature content editor if no signature is currently selected', () => {
			setupTest(<SignatureSettings {...buildProps({})} />);
			const contentEditable = screen.getByTestId('signature-editor-content-editable');
			expect(contentEditable).toHaveAttribute('contenteditable', 'false');
		});

		it('should keep the applied text color after switching to another signature and back', async () => {
			const signatureA = buildSignature({
				label: 'Signature A',
				name: 'Signature A',
				content: [{ type: 'text/html', _content: 'colored text' }]
			});
			const signatureB = buildSignature({
				label: 'Signature B',
				name: 'Signature B',
				content: [{ type: 'text/html', _content: 'content B' }]
			});
			const signatures: Array<SignItemType> = [signatureA, signatureB];
			handleGetSignaturesRequest(signatures);
			const { user } = setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signatureA.name, undefined, { timeout: FIND_TIMEOUT });

			const list = screen.getByTestId(TESTID_SELECTORS.signaturesList);
			const editor = screen.getByTestId(TESTID_SELECTORS.signatureEditor);

			const textA = await within(editor).findByText('colored text');
			await user.click(textA);
			await user.keyboard('{Control>}a{/Control}');
			await user.click(screen.getByRole('button', { name: 'lexical-label.text_color' }));
			await user.click(await screen.findByTestId('color-swatch-red'));

			const coloredNode = await within(editor).findByText('colored text');
			expect(coloredNode).toHaveStyle({ color: 'rgb(239, 83, 80)' });

			await user.click(await within(list).findByText(signatureB.name));
			await within(editor).findByText('content B');

			await user.click(await within(list).findByText(signatureA.name));
			const reloadedNode = await within(editor).findByText('colored text');
			expect(reloadedNode).toHaveStyle({ color: 'rgb(239, 83, 80)' });
		});

		it('should preserve the color from a signature authored with legacy <font color> markup', async () => {
			const signature = buildSignature({
				content: [{ type: 'text/html', _content: '<font color="#ff0000">legacy red text</font>' }]
			});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });

			const editor = screen.getByTestId(TESTID_SELECTORS.signatureEditor);
			const coloredNode = await within(editor).findByText('legacy red text');
			expect(coloredNode).toHaveStyle({ color: '#ff0000' });
		});

		it('should preserve color combined with another format (e.g. italic) after reload', async () => {
			const signature = buildSignature({
				content: [
					{
						type: 'text/html',
						_content:
							'<p><i><em style="color: rgb(239, 83, 80); white-space: pre-wrap;">Developer</em></i></p>'
					}
				]
			});
			const signatures: Array<SignItemType> = [signature];
			handleGetSignaturesRequest(signatures);
			setupTest(<SettingsViewMock preloadedSignatures={signatures} />);

			await screen.findByText(signature.name, undefined, { timeout: FIND_TIMEOUT });

			const editor = screen.getByTestId(TESTID_SELECTORS.signatureEditor);
			const coloredNode = await within(editor).findByText('Developer');
			expect(coloredNode).toHaveStyle({ color: 'rgb(239, 83, 80)' });
			expect(coloredNode.tagName.toLowerCase()).toBe('em');
		});
	});
});
