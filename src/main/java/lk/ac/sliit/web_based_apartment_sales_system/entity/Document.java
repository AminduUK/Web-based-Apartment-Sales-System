package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "documents")
@AllArgsConstructor
@NoArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "document_type")
    private String documentType;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_url", nullable = false, columnDefinition = "LONGTEXT")
    private String fileUrl;

    @Column(name = "upload_date")
    private LocalDate uploadDate;

    public Document(Listing listing, String documentType, String fileName, String fileUrl) {
        this.listing = listing;
        this.documentType = documentType;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.uploadDate = LocalDate.now();
    }
}
