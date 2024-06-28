/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Dropdown, DropdownItem, IconButton } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map, noop, unescape } from 'lodash';

import { getMailBodyWithSignature } from '../../../../../helpers/signatures';
import { GetAllSignatures } from '../../../../../store/actions/signatures';
import { useEditorSignatureId, useEditorText } from '../../../../../store/zustand/editor';
import { MailsEditorV2, SignItemType } from '../../../../../types';

export type SignaturesDropdownProps = {
	editorId: MailsEditorV2['id'];
};

export const ChangeSignaturesDropdown: FC<SignaturesDropdownProps> = ({ editorId }) => {
	const [signatures, setSignatures] = useState<SignItemType[]>(() => []);
	const { signatureId, setSignatureId } = useEditorSignatureId(editorId);
	const { text, setText } = useEditorText(editorId);
	const doNotUseSignatureLabel = t('label.do_not_use_signature', 'Do not use a signature');

	const onSignaturesLoaded = useCallback(
		(signs: Array<SignItemType>) => {
			const signaturesItems = map(signs, (item: SignItemType, idx) => ({
				label: item.name,
				name: item.name,
				id: item.id,
				description: unescape(item?.content?.[0]?._content)
			}));
			signaturesItems.push({
				label: doNotUseSignatureLabel,
				name: doNotUseSignatureLabel,
				id: '',
				description: ''
			});
			setSignatures(signaturesItems);
		},
		[doNotUseSignatureLabel]
	);

	useEffect(() => {
		GetAllSignatures()
			.then(({ signature: signs }) => {
				onSignaturesLoaded(signs);
			})
			.catch((err) => {
				console.error(err);
			});
	}, [onSignaturesLoaded]);

	const onSignatureSelected = useCallback(
		(signature: SignItemType): void => {
			setSignatureId(signature.id);
			const textWithSignature = getMailBodyWithSignature(text, signature.id);
			setText(textWithSignature);
		},
		[setSignatureId, setText, text]
	);

	const dropdownEntries = useMemo<Array<DropdownItem>>(
		() =>
			signatures.map((signature) => ({
				id: signature.id,
				label: signature.name,
				selected: signature.id === signatureId,
				onClick: (): void => {
					onSignatureSelected(signature);
				}
			})),
		[onSignatureSelected, signatureId, signatures]
	);
	return (
		<>
			{dropdownEntries.length > 1 && (
				<Dropdown
					items={dropdownEntries}
					selectedBackgroundColor={'gray5'}
					data-testid="signature-dropdown"
				>
					<IconButton
						data-testid="change-sign-dropdown-icon"
						size="large"
						icon="SignatureOutline"
						onClick={noop}
					/>
				</Dropdown>
			)}
		</>
	);
};
