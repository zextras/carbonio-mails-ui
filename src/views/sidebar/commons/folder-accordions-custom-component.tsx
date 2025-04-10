/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import {
	AccordionItem,
	Avatar,
	Container,
	Icon,
	Padding,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t, useUserAccount } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { ROOT_NAME } from '../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { useOnMouseHover } from '../../../hooks/use-on-mouse-hover';
import { Folder } from '../../../types';
import { FolderActionWrapper } from '../folder-action-wrapper';
import { getFolderTranslatedName, getFolderIconName, getFolderIconColor } from '../utils';

const FittedRow = styled(Row)`
	max-width: calc(100% - (2 * ${({ theme }): string => theme.sizes.padding.small}));
	height: 3rem;
`;

export const FolderAccordionCustomComponent = ({
	folder
}: {
	folder: Folder;
}): React.JSX.Element => {
	const { ref, hasBeenHovered } = useOnMouseHover();
	const accountName = useUserAccount().name;

	const textProps: { size: 'small' } = useMemo(
		() => ({
			size: 'small'
		}),
		[]
	);
	const accordionItem = useMemo(
		() => ({
			...folder,
			label:
				folder.id === FOLDERS.USER_ROOT
					? accountName
					: (getFolderTranslatedName({ folderId: folder.id, folderName: folder.name }) ?? ''),
			icon: getFolderIconName(folder) ?? undefined,
			iconColor: getFolderIconColor(folder) ?? '',
			textProps
		}),
		[folder, accountName, textProps]
	);

	const statusIcon = useMemo(() => {
		const RowWithIcon = (icon: string, color: string, tooltipText: string): React.JSX.Element => (
			<Padding left="small">
				<Tooltip placement="right" label={tooltipText}>
					<Row>
						<Icon icon={icon} color={color} size="medium" />
					</Row>
				</Tooltip>
			</Padding>
		);

		if (folder.acl?.grant) {
			const tooltipText = t('tooltip.folder_sharing_status', {
				count: folder.acl.grant.length,
				defaultValue_one: 'Shared with {{count}} person',
				defaultValue: 'Shared with {{count}} people'
			});
			return RowWithIcon('Shared', 'shared', tooltipText);
		}
		if (folder.isLink) {
			const tooltipText = t('tooltip.folder_linked_status', 'Linked to me');
			return RowWithIcon('Linked', 'linked', tooltipText);
		}
		return '';
	}, [folder.acl?.grant, folder.isLink]);

	// hide folders where a share was provided and subsequently removed
	if (folder.isLink && folder.broken) {
		return <></>;
	}

	if (folder.id === FOLDERS.USER_ROOT || (folder.isLink && folder.oname === ROOT_NAME))
		return (
			<FittedRow>
				<Padding left="small">
					<Avatar label={accordionItem.label} colorLabel={accordionItem.iconColor} size="medium" />
				</Padding>
				<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
					<AccordionItem data-testid={`accordion-folder-item-${folder.id}`} item={accordionItem} />
				</Tooltip>
			</FittedRow>
		);

	return (
		<Row width="fill" minWidth={0} ref={ref}>
			{hasBeenHovered ? (
				<FolderActionWrapper folder={folder}>
					<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
						<AccordionItem data-testid={`accordion-folder-item-${folder.id}`} item={accordionItem}>
							{statusIcon}
						</AccordionItem>
					</Tooltip>
				</FolderActionWrapper>
			) : (
				<Container padding={{ left: 'small' }}>
					<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
						<AccordionItem data-testid={`accordion-folder-item-${folder.id}`} item={accordionItem}>
							{statusIcon}
						</AccordionItem>
					</Tooltip>
				</Container>
			)}
		</Row>
	);
};
