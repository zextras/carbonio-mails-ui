/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, FC, useState, useCallback, useEffect } from 'react';
import {
	Container,
	Input,
	Padding,
	Text,
	Divider,
	Button,
	Tooltip,
	List
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { filter, find } from 'lodash';
import Heading from './components/settings-heading';
import { domainWhitelistSubSection } from './subsections';
import TrusteeListItem from './components/trustee-list-item';
import LoadingShimmer from './filters/parts/loading-shimmer';

type UpdateSettingsProps = {
	target: {
		name: string;
		value: string | Array<string> | undefined;
	};
};

type InputProps = {
	settingsObj: Record<string, string | Array<string>>;
	updateSettings: (arg: UpdateSettingsProps) => void;
};

const NonSupportedCharacters = /[!#$%^&*()_+\-=[\]{};':"\\|,.<>/?|/^\s*$/]+/;
const TrusteeAddresses: FC<InputProps> = ({ settingsObj, updateSettings }) => {
	const [t] = useTranslation();
	const [address, setAddress] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [trusteeAddressesList, setTrusteeAddressList] = useState<string[]>([]);

	const sectionTitle = useMemo(() => domainWhitelistSubSection(t), [t]);
	const message = useMemo(
		() =>
			t(
				'messages.trustee_addresses',
				'Mail from these addresses or domains will be considered trusted and images will automatically be displayed.'
			),
		[t]
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
		[t, isInvalid]
	);

	return (
		<Container background="gray6" padding={{ horizontal: 'medium', bottom: 'large' }}>
			<Container
				orientation="horizontal"
				padding={{ horizontal: 'medium', top: 'medium' }}
				mainAllignment="space-between"
			>
				<Container width="50%" id={sectionTitle.id}>
					<Heading title={sectionTitle.label} size="medium" />
				</Container>
				<Container width="50%" crossAlignment="flex-end">
					<Text size="extrasmall">{message}</Text>
				</Container>
			</Container>
			<Divider />
			<Container
				padding={{ all: 'medium', bottom: 'small' }}
				orientation="horizontal"
				mainAlignment="flex-start"
			>
				<Input
					width="80vw"
					maxWidth="50%"
					background="gray5"
					label={t('label.enter_email_address', 'Enter email address or domain')}
					value={address}
					hasError={isInvalid}
					description={warningMessage}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAddress(e.target.value)}
				/>
				<Padding left="medium">
					<Tooltip label={warningMessage} disabled={!isInvalid} maxWidth="100%">
						<Button
							label={t('label.add', 'add')}
							type="outlined"
							onClick={onAdd}
							disabled={isInvalid}
						/>
					</Tooltip>
				</Padding>
			</Container>
			<Container
				padding={{ all: 'medium', bottom: 'small' }}
				orientation="horizontal"
				mainAlignment="flex-start"
			>
				{isLoading ? (
					<LoadingShimmer />
				) : (
					<List
						items={trusteeAddressesList}
						ItemComponent={TrusteeListItem}
						itemProps={{ onRemove }}
					/>
				)}
			</Container>
		</Container>
	);
};

export default TrusteeAddresses;
