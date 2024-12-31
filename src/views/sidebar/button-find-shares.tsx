/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { SyntheticEvent, useCallback, useMemo } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, isEqual, uniqWith } from 'lodash';

import { SharesModal } from './shares-modal';
import { ResFolder } from '../../carbonio-ui-commons/utils';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { getShareInfo } from '../../store/actions/get-share-info';

export const ButtonFindShares = (): React.JSX.Element => {
	const { createModal, closeModal } = useUiUtilities();

	const label = useMemo(() => t('label.find_shares', 'Find shares'), []);
	const openFindShares = useCallback(
		(ev: SyntheticEvent<HTMLButtonElement, Event> | KeyboardEvent): void => {
			ev.stopPropagation();
			getShareInfo().then((res) => {
				if ('Fault' in res) return;
				if (res.share?.length > 0) {
					const resFolders: Array<ResFolder> = uniqWith(
						filter(res.share, ['view', 'message']),
						isEqual
					);
					const id = Date.now().toString();
					createModal(
						{
							id,
							children: <SharesModal folders={resFolders} onClose={(): void => closeModal(id)} />
						},
						true
					);
				}
			});
		},
		[closeModal, createModal]
	);

	return (
		<Container padding={{ horizontal: 'medium', vertical: 'small' }} key="button-find-shares">
			<Button type="outlined" label={label} width="fill" color="primary" onClick={openFindShares} />
		</Container>
	);
};
