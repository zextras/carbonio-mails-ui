/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable import/extensions */

import React, { FC, ReactElement } from 'react';
import { Container, Button, Padding, Divider, Checkbox } from '@zextras/zapp-ui';

type ModalFooterProps = {
	onConfirm: () => void;
	label: string;
	disabled: boolean;
	checkboxLabel: string;
	onSecondaryAction: () => void;
	checked: boolean;
};

const ModalFooter: FC<ModalFooterProps> = ({
	onConfirm,
	label,
	disabled,
	checkboxLabel,
	checked,
	onSecondaryAction
}): ReactElement => (
	<Container mainAlignment="center" crossAlignment="center" padding={{ top: 'large' }}>
		<Divider />
		<Container orientation="horizontal" padding={{ top: 'medium' }} mainAlignment="space-between">
			<Checkbox defaultChecked={checked} onClick={onSecondaryAction} label={checkboxLabel} />
			<Padding vertical="small">
				<Button onClick={onConfirm} label={label} disabled={disabled} />
			</Padding>
		</Container>
	</Container>
);
export default ModalFooter;
