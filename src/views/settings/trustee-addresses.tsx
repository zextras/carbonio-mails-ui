/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';

import {
	Container,
	Input,
	Padding,
	Divider,
	Button,
	Tooltip,
	TextWithTooltip,
	Row,
	ListV2
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, find, map } from 'lodash';

import { SendersListItem } from './components/senders-list-item';
import Heading from './components/settings-heading';
import LoadingShimmer from './filters/parts/loading-shimmer';
import { trustedAddressesSubSection } from './subsections';
import type { InputProps } from '../../types';

const NonSupportedCharacters = /[!#$%^&*()+=[\]{};':"\\|,<>/?|/^\s*$/]+/;
const TrusteeAddresses = ({ settingsObj, updateSettings }: InputProps): React.JSX.Element => {
	const [address, setAddress] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [trusteeAddressesList, setTrusteeAddressList] = useState<string[]>([]);
	const sectionTitle = useMemo(() => trustedAddressesSubSection(), []);
	const message = useMemo(
		() =>
			t(
				'messages.trustee_addresses',
				'Mail from these addresses or domains will be considered trusted and images will automatically be displayed.'
			),
		[]
	);

	const onRemove = useCallback(
		(item: string) => {
			const newList = filter(trusteeAddressesList, (add) => add !== item);

			updateSettings({
				target: {
					name: 'zimbraPrefMailTrustedSenderList',
					value: newList
				}
			});
			setTrusteeAddressList(newList);
		},
		[trusteeAddressesList, updateSettings]
	);

	const onAdd = useCallback(() => {
		updateSettings({
			target: {
				name: 'zimbraPrefMailTrustedSenderList',
				value: [...trusteeAddressesList, address]
			}
		});
		setTrusteeAddressList([...trusteeAddressesList, address]);
		setAddress('');
	}, [address, trusteeAddressesList, updateSettings]);

	useEffect(() => {
		const trusteeList = settingsObj?.zimbraPrefMailTrustedSenderList;
		if (typeof trusteeList === 'string') setTrusteeAddressList([trusteeList]);
		else setTrusteeAddressList(trusteeList ?? []);

		setIsLoading(false);
	}, [settingsObj?.zimbraPrefMailTrustedSenderList]);

	const isInvalid = useMemo(
		() =>
			!!find(trusteeAddressesList, (ta) => ta === address) || NonSupportedCharacters.test(address),
		[address, trusteeAddressesList]
	);

	const warningMessage = useMemo(
		() =>
			isInvalid
				? t('messages.invalid_trustee_address', 'Please enter only e-mail addresses or domains')
				: '',
		[isInvalid]
	);

	const trusteeAddressesListItems = useMemo(
		() =>
			map(trusteeAddressesList, (el) => ({
				id: el,
				value: el,
				label: el
			})),
		[trusteeAddressesList]
	);

	return (
		<Container background="gray6" padding={{ horizontal: 'medium', bottom: 'large' }}>
			<Container orientation="horizontal" padding={{ horizontal: 'medium', top: 'medium' }}>
				<Container id={sectionTitle.id}>
					<Heading title={sectionTitle.label} size="medium" />
				</Container>
				<Container width="auto" crossAlignment="flex-end">
					<TextWithTooltip size="extrasmall">{message}</TextWithTooltip>
				</Container>
			</Container>
			<Divider />
			<Container
				padding={{ all: 'medium', bottom: 'small' }}
				orientation="horizontal"
				mainAlignment="flex-start"
			>
				<Row mainAlignment="flex-start" width="50vw">
					<Input
						label={t('label.enter_email_address', 'Enter email address or domain')}
						value={address}
						hasError={isInvalid}
						description={warningMessage}
						backgroundColor="gray5"
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAddress(e.target.value)}
					/>
				</Row>
				<Padding left="medium">
					<Tooltip label={warningMessage} disabled={!isInvalid} maxWidth="100%">
						<Button
							label={t('label.add', 'Add')}
							type="outlined"
							onClick={onAdd}
							disabled={isInvalid}
						/>
					</Tooltip>
				</Padding>
			</Container>
			<Container
				padding={{ horizontal: 'medium', bottom: 'small' }}
				orientation="horizontal"
				mainAlignment="flex-start"
			>
				{isLoading ? (
					<LoadingShimmer />
				) : (
					<ListV2 data-testid={'trustee-list'}>
						{trusteeAddressesList.map((trustee, idx) => (
							<SendersListItem key={idx} value={trustee} onRemove={onRemove} />
						))}
					</ListV2>
				)}
			</Container>
		</Container>
	);
};

export default TrusteeAddresses;
