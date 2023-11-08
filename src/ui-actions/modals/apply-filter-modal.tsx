/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

export type ApplyFilterModalProps = {
	filterName: string;
};

/**
 * TODO as soon the modal is needed in another point of the code
 * 	we need to create a UI action for that
 *
 * @param filterName
 * @param onCancel
 * @param onConfirm
 * @constructor
 */
export const ApplyFilterModal: FC<ApplyFilterModalProps> = ({ filterName }) => (
	<>Qualcosa di interessante</>
);
