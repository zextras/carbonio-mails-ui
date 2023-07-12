/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Avatar,
	Container,
	Dropdown,
	DropdownItem,
	IconButton,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	Account,
	AccountSettings,
	t,
	useUserAccount,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import styled from 'styled-components';

import { getIdentityDescription, IdentityDescriptor } from '../../../../../helpers/identities';

const SelectorContainer = styled(Row)`
	border-radius: 4px;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

/**
 *
 * @param identity
 * @param account
 * @param settings
 * @param fallbackDescription
 */
const createIdentitySelectorItemElement = (
	identity: IdentityDescriptor | null,
	account: Account,
	settings: AccountSettings,
	fallbackDescription: string
): JSX.Element => {
	const identityDescription = identity
		? getIdentityDescription(identity, account, settings, t)
		: fallbackDescription;

	return (
		<Container width="100%" orientation="horizontal" height="fit">
			<Avatar label={identity?.identityName || identity?.fromDisplay || fallbackDescription} />
			<Container width="100%" crossAlignment="flex-start" height="fit" padding={{ left: 'medium' }}>
				<Text weight="bold">{identity?.identityDisplayName || fallbackDescription}</Text>
				<Text color="gray1">{identityDescription}</Text>
			</Container>
		</Container>
	);
};

/**
 *
 */
export type EditViewIdentitySelectorProps = {
	selected: IdentityDescriptor | null;
	identities: Array<IdentityDescriptor>;
	onIdentitySelected: (selected: IdentityDescriptor) => void;
};

/**
 *
 * @param selected
 * @param identities
 * @param onIdentitySelected
 * @constructor
 */
export const EditViewIdentitySelector: FC<EditViewIdentitySelectorProps> = ({
	selected,
	identities,
	onIdentitySelected
}) => {
	const account = useUserAccount();
	const settings = useUserSettings();

	const [open, setOpen] = useState(false);
	const noName = useMemo(() => t('label.no_name', '<No Name>'), []);
	const selectedDescription = selected
		? getIdentityDescription(selected, account, settings, t)
		: noName;

	const toggleOpen = useCallback(() => {
		setOpen((s) => !s);
	}, []);

	const close = useCallback(() => {
		setOpen(false);
	}, []);

	const dropdownEntries = useMemo<Array<DropdownItem>>(
		() =>
			identities.map((identity, index) => ({
				id: identity.id,
				label: getIdentityDescription(identity, account, settings, t) ?? noName,
				selected: identity.id === selected?.id,
				onClick: (): void => {
					onIdentitySelected(identity);
					close();
				},
				customComponent: createIdentitySelectorItemElement(identity, account, settings, noName)
			})),
		[account, close, identities, noName, onIdentitySelected, selected, settings]
	);

	return (
		<SelectorContainer orientation="horizontal" mainAlignment="space-between">
			<Tooltip label={selectedDescription} maxWidth="100%" placement="top-start">
				<Dropdown
					items={dropdownEntries}
					width="fit"
					maxWidth="100%"
					selectedBackgroundColor="highlight"
					data-testid="from-dropdown"
				>
					<Row
						onClick={toggleOpen}
						width="100%"
						orientation="horizontal"
						height="fit"
						wrap="nowrap"
						padding={{ all: 'small' }}
					>
						{createIdentitySelectorItemElement(selected, account, settings, noName)}
						<IconButton icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'} onClick={noop} />
					</Row>
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
