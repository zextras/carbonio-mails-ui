/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useMemo } from 'react';
import { Container, Text, Row, Select, SelectItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
import { NO_SIGNATURE_ID, NO_SIGNATURE_LABEL } from '../../../helpers/signatures';
import type { AccountIdentity, IdentityProps, SignItemType } from '../../../types';

type SelectIdentitySignProps = {
	acc: AccountIdentity;
	signatures: SignItemType[];
	signatureSelectItems: SelectItem[];
	updateIdentities: (arg: { _attrs: IdentityProps }) => void;
};

// TODO remove the any after the DS
const SelectIdentitySignature: FC<SelectIdentitySignProps> = ({
	acc,
	signatures,
	signatureSelectItems,
	updateIdentities
}): ReactElement => {
	const getSignature = useCallback(
		(id: string, fallbackOnFirst = false) => {
			const result = find(signatures, ['id', id]);
			if (!result && fallbackOnFirst && signatures.length > 0) {
				return signatures[0];
			}

			return result;
		},
		[signatures]
	);

	// Create the fake signature for the "no signature"
	const noSignature: SignItemType = useMemo(
		() => ({
			label: t('label.no_signature', NO_SIGNATURE_LABEL),
			name: 'no signature',
			description: '',
			id: NO_SIGNATURE_ID
		}),
		[]
	);

	// Get the selected signatures for the new message and for the replies
	const [signatureNewMessage, signatureRepliesForwards] = useMemo<[SignItemType, SignItemType]>(
		() => [
			getSignature(acc._attrs?.zimbraPrefDefaultSignatureId ?? '') ?? noSignature,
			getSignature(String(acc._attrs?.zimbraPrefForwardReplySignatureId)) ?? noSignature
		],
		[
			acc._attrs?.zimbraPrefDefaultSignatureId,
			acc._attrs?.zimbraPrefForwardReplySignatureId,
			getSignature,
			noSignature
		]
	);

	return (
		<Row width="100%" padding={{ horizontal: 'small', vertical: 'small' }}>
			<Container
				width="20%"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				padding={{ right: 'medium' }}
			>
				<Text>{acc.name}</Text>
			</Container>
			<Container width="40%" padding={{ right: 'medium' }}>
				<Select
					items={signatureSelectItems}
					label={t('title.new_messages', 'New Messages')}
					selection={
						{
							label: signatureNewMessage?.label,
							value: signatureNewMessage?.id
						} as SelectItem
					}
					onChange={(selectedId: any): void => {
						if (selectedId === signatureNewMessage?.id) {
							return;
						}
						updateIdentities({
							...acc,
							_attrs: { ...acc._attrs, zimbraPrefDefaultSignatureId: selectedId }
						});
					}}
				/>
			</Container>
			<Container width="40%">
				<Select
					items={signatureSelectItems}
					label={t('title.replies_forwards', 'Replies & Forwards')}
					selection={
						{
							label: signatureRepliesForwards?.label,
							value: signatureRepliesForwards?.id
						} as SelectItem
					}
					onChange={(selectedId: any): void => {
						if (selectedId === signatureRepliesForwards?.id) {
							return;
						}
						updateIdentities({
							...acc,
							_attrs: { ...acc._attrs, zimbraPrefForwardReplySignatureId: selectedId }
						});
					}}
				/>
			</Container>
		</Row>
	);
};

export default SelectIdentitySignature;
