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
import { t } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import styled from 'styled-components';

import {
	getIdentitiesDescriptors,
	getIdentityDescription,
	getIdentityDescriptor,
	getNoIdentityPlaceholder,
	IdentityDescriptor
} from '../../../../../helpers/identities';
import { getMailBodyWithSignature } from '../../../../../helpers/signatures';
import { useEditorIdentityId, useEditorText } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';

const SelectorContainer = styled(Row)`
	border-radius: 4px;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

/**
 *
 * @param identity - Identity to display
 * @param useExtendedDescription - Compose an extended description containing name and rights
 * @param fallbackDescription - Description to use if no one is available for the given identity
 */
const createIdentitySelectorItemElement = (
	identity: IdentityDescriptor | null,
	useExtendedDescription: boolean,
	fallbackDescription: string
): JSX.Element => {
	// eslint-disable-next-line no-nested-ternary
	const identityDescription = identity
		? useExtendedDescription
			? getIdentityDescription(identity, t)
			: identity.fromAddress
		: fallbackDescription;

	return (
		<Container width="100%" orientation="horizontal" height="fit">
			<Avatar label={identity?.identityName || identity?.fromDisplay || fallbackDescription} />
			<Container width="100%" crossAlignment="flex-start" height="fit" padding={{ left: 'medium' }}>
				<Text weight="bold">{identity?.identityDisplayName || fallbackDescription}</Text>
				<Text size="small" color="gray1">
					{identityDescription}
				</Text>
			</Container>
		</Container>
	);
};

export type EditViewIdentitySelectorProps = {
	editorId: MailsEditorV2['id'];
};

export const EditViewIdentitySelector: FC<EditViewIdentitySelectorProps> = ({ editorId }) => {
	const { identityId, setIdentityId } = useEditorIdentityId(editorId);
	const { text, setText } = useEditorText(editorId);

	const [open, setOpen] = useState(false);

	const noName = useMemo(() => getNoIdentityPlaceholder(), []);
	const selected = useMemo<IdentityDescriptor | null>(
		() => getIdentityDescriptor(identityId),
		[identityId]
	);
	const selectedDescription = selected ? getIdentityDescription(selected, t) : noName;
	const identities = useMemo<Array<IdentityDescriptor>>(() => getIdentitiesDescriptors(), []);

	const onIdentitySelected = useCallback(
		(identity: IdentityDescriptor): void => {
			setIdentityId(identity.id);
			const textWithSignature = getMailBodyWithSignature(text, identity.defaultSignatureId);
			setText(textWithSignature);
		},
		[setIdentityId, setText, text]
	);

	const toggleOpen = useCallback(() => {
		setOpen((s) => !s);
	}, []);

	const close = useCallback(() => {
		setOpen(false);
	}, []);

	const dropdownEntries = useMemo<Array<DropdownItem>>(
		() =>
			identities.map((identity) => ({
				id: identity.id,
				label: getIdentityDescription(identity, t) ?? noName,
				selected: identity.id === selected?.id,
				onClick: (): void => {
					onIdentitySelected(identity);
					close();
				},
				customComponent: createIdentitySelectorItemElement(identity, true, noName)
			})),
		[close, identities, noName, onIdentitySelected, selected]
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
						{createIdentitySelectorItemElement(selected, false, noName)}
						<IconButton icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'} onClick={noop} />
					</Row>
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};
