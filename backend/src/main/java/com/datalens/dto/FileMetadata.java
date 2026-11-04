package com.datalens.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {
    private String storagePath;
    private long fileSize;
    private long rowCount;
    private int columnCount;
}

