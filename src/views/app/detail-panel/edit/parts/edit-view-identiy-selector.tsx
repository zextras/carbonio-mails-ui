/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
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
import { t } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { getIdentityDescription, Identity } from '../../../../../helpers/identities';

const SelectorContainer = styled(Row)`
	border-radius: 4px;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

/**
 *
 */
export type EditViewIdentitySelectorProps = {
	selected: Identity | null;
	identities: Array<Identity>;
	onIdentitySelected: (selected: Identity) => void;
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
	const [open, setOpen] = useState(false);
	const noName = useMemo(() => t('label.no_name', '<No Name>'), []);
	const selectedDescription = selected ? getIdentityDescription(selected, t) : noName;

	const toggleOpen = useCallback(() => {
		setOpen((s) => !s);
	}, []);

	const dropdownEntries = useMemo<Array<DropdownItem>>(
		() =>
			identities.map((identity, index) => ({
				id: identity.id,
				label: getIdentityDescription(identity, t) ?? '',
				// TODO complete implementation
				onClick: (): void => {
					onIdentitySelected(identity);
				}
			})),
		[identities, onIdentitySelected]
	);

	return (
		<SelectorContainer orientation="horizontal" mainAlignment="space-between">
			<Tooltip label={selectedDescription} maxWidth="100%" placement="top-start">
				<Dropdown
					items={dropdownEntries}
					width="fit"
					maxWidth="100%"
					forceOpen={open}
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
						<Avatar label={selected?.identityName || noName} />
						<Container
							width="100%"
							crossAlignment="flex-start"
							height="fit"
							padding={{ left: 'medium', right: 'medium' }}
						>
							<Text weight="bold" data-testid="from-identity-display-name">
								{selected?.displayName || selected?.identityName || selected?.fromAddress}
							</Text>
							<Text color="gray1" size="small" data-testid="from-identity-address">
								{selected?.fromAddress}
							</Text>
						</Container>
						<IconButton icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'} onClick={noop} />
					</Row>
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
