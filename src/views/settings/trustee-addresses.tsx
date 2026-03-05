/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';

import {
	Tooltip,
	Text,
	FormSection,
	FormSubSection,
	Input,
	Button,
	Container,
	Row,
	Padding,
	ListV2
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, find } from 'lodash';

import { InputProps } from 'types/settings';
import { SendersListItem } from 'views/settings/components/senders-list-item';
import LoadingShimmer from 'views/settings/filters/parts/loading-shimmer';
import { trustedAddressesSubSection } from 'views/settings/subsections';

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

	return (
		<FormSection label={sectionTitle.label} id={sectionTitle.id}>
			<FormSubSection>
				<Tooltip label={message} overflowTooltip>
					<Text>{message}</Text>
				</Tooltip>
				<Container
					orientation="horizontal"
					height={'fit'}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<Row mainAlignment="flex-start" width="50vw">
						<Input
							label={t('label.enter_email_address', 'Enter email address or domain')}
							value={address}
							hasError={isInvalid}
							description={warningMessage}
							backgroundColor="gray5"
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
								setAddress(e.target.value)
							}
						/>
					</Row>
					<Padding left="medium" top="extrasmall">
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
				<Container orientation="horizontal" mainAlignment="flex-start" height={'fit'}>
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
			</FormSubSection>
		</FormSection>
	);
};

export default TrusteeAddresses;
