/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Avatar,
	Container,
	Dropdown,
	IconButton,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
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
	selected: Identity;
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
	const selectedDescription = getIdentityDescription(selected, t);

	const toggleOpen = useCallback(() => {
		setOpen((s) => !s);
	}, []);

	const noName = useMemo(() => t('label.no_name', '<No Name>'), [t]);

	return (
		<SelectorContainer orientation="horizontal" mainAlignment="space-between">
			<Tooltip label={selectedDescription} maxWidth="100%" placement="top-start">
				<Dropdown
					// eslint-disable-next-line @typescript-eslint/ban-ts-commentg
					// @ts-ignore
					items={identities.map((identity, index) => ({
						...identity,
						id: index
					}))}
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
						<Avatar label={selected.identityName || noName} />
						<Container
							width="100%"
							crossAlignment="flex-start"
							height="fit"
							padding={{ left: 'medium', right: 'medium' }}
						>
							<Text weight="bold" data-testid="from-identity-display-name">
								{from?.displayName || from?.fullName || from?.address}
							</Text>
							<Text color="gray1" size="small" data-testid="from-identity-address">
								{from?.address}
							</Text>
						</Container>
						<IconButton
							icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'}
							onClick={(): null => null}
						/>
					</Row>
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
