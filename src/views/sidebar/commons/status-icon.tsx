/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Icon, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { Folder } from '@zextras/carbonio-ui-commons';
import { t } from 'i18next';

const RowWithIcon = (icon: string, color: string, tooltipText: string): React.JSX.Element => (
	<Padding left="small">
		<Tooltip placement="right" label={tooltipText}>
			<Row>
				<Icon icon={icon} color={color} size="medium" />
			</Row>
		</Tooltip>
	</Padding>
);

export const StatusIcon = ({ folder }: { folder: Folder }): React.JSX.Element => {
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
	return <></>;
};
