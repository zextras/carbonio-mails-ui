/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, SyntheticEvent, useCallback, useMemo } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, isEqual, uniqWith } from 'lodash';

import { SharesModal } from './shares-modal';
import { ResFolder } from '../../carbonio-ui-commons/utils';
import { useAppDispatch } from '../../hooks/redux';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { getShareInfo } from '../../store/actions/get-share-info';
import { StoreProvider } from '../../store/redux';

export const ButtonFindShares: FC = () => {
	const dispatch = useAppDispatch();
	const { createModal, closeModal } = useUiUtilities();

	const label = useMemo(() => t('label.find_shares', 'Find shares'), []);
	const openFindShares = useCallback(
		(ev: SyntheticEvent<HTMLButtonElement, Event> | KeyboardEvent): void => {
			ev.stopPropagation();
			dispatch(getShareInfo())
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res: any) => {
					if (res.type.includes('fulfilled') && res.payload?.share?.length > 0) {
						const resFolders: Array<ResFolder> = uniqWith(
							filter(res.payload.share, ['view', 'message']),
							isEqual
						);
						const id = Date.now().toString();
						createModal(
							{
								id,
								children: (
									<StoreProvider>
										<SharesModal folders={resFolders} onClose={(): void => closeModal(id)} />
									</StoreProvider>
								)
							},
							true
						);
					}
				});
		},
		[closeModal, createModal, dispatch]
	);

	return (
		<Container padding={{ horizontal: 'medium', vertical: 'small' }} key="button-find-shares">
			<Button type="outlined" label={label} width="fill" color="primary" onClick={openFindShares} />
		</Container>
	);
};
