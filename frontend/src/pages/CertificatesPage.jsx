import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Card, Badge, Pagination } from '../components/common/LayoutElements';
import { Button } from '../components/common/FormElements';
import { Navbar } from '../components/layout/Navbar';
import { certificateService } from '../services';
import toast from 'react-hot-toast';

export const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, [page]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificateService.getAll({ page, limit: 10 });
      setCertificates(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificate) => {
    try {
      const element = document.getElementById(`certificate-${certificate._id}`);
      const canvas = await html2canvas(element, { scale: 2 });
      const image = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(image, 'PNG', 0, 0, 297, 210);
      pdf.save(`${certificate.certificateNumber}.pdf`);

      await certificateService.download(certificate._id);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  const CertificateTemplate = ({ certificate }) => (
    <div
      id={`certificate-${certificate._id}`}
      className="w-full bg-gradient-to-br from-yellow-50 to-yellow-100 p-12 rounded-lg shadow-xl"
      style={{
        aspectRatio: '1.4 / 1',
        border: '20px solid #0A3D62',
        boxShadow: 'inset 0 0 0 2px white, inset 0 0 0 4px #0A3D62',
      }}
    >
      <div className="h-full flex flex-col items-center justify-center text-center">
        {/* Header */}
        <h1 className="text-5xl font-bold text-primary mb-4">CERTIFICATE</h1>
        <p className="text-xl text-gray-700 mb-8">OF COMPLETION</p>

        {/* Content */}
        <p className="text-sm text-gray-600 mb-4">This is to certify that</p>
        <h2 className="text-3xl font-bold text-primary mb-6">
          {certificate.intern?.firstName} {certificate.intern?.lastName}
        </h2>
        <p className="text-sm text-gray-600 mb-2">has successfully completed the internship program in</p>
        <p className="text-2xl font-semibold text-secondary mb-8">{certificate.category?.name}</p>

        {/* Details */}
        <div className="flex gap-16 mb-8 text-sm">
          <div>
            <p className="text-gray-600">Grade</p>
            <p className="text-xl font-bold text-primary">{certificate.grade}</p>
          </div>
          <div>
            <p className="text-gray-600">Score</p>
            <p className="text-xl font-bold text-primary">{certificate.score}%</p>
          </div>
          <div>
            <p className="text-gray-600">Issue Date</p>
            <p className="text-xl font-bold text-primary">
              {new Date(certificate.issueDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* QR Code and signature */}
        <div className="flex gap-12 items-end">
          <div className="flex flex-col items-center">
            <QRCode
              value={`https://rimp.com/verify/${certificate.certificateNumber}`}
              size={80}
            />
            <p className="text-xs text-gray-600 mt-2">{certificate.certificateNumber}</p>
          </div>
          <div className="text-left text-sm">
            <p className="border-t border-primary w-32 pt-1 mb-1">Manager Signature</p>
            <p className="text-xs text-gray-600">{certificate.manager?.firstName} {certificate.manager?.lastName}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">My Certificates</h1>
          <p className="text-gray-600">View and download your earned certificates</p>
        </motion.div>

        {loading ? (
          <Card className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </Card>
        ) : certificates.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600 text-lg">No certificates yet</p>
            <p className="text-gray-500">Complete internships to earn certificates</p>
          </Card>
        ) : (
          <>
            {selectedCert ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setSelectedCert(null)}
                  className="mb-6"
                >
                  ← Back to List
                </Button>

                <CertificateTemplate certificate={selectedCert} />

                <div className="mt-6 flex gap-4 justify-center">
                  <Button
                    variant="primary"
                    onClick={() => downloadCertificate(selectedCert)}
                  >
                    Download PDF
                  </Button>
                  <Button variant="secondary">Share</Button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {certificates.map((cert, index) => (
                    <motion.div
                      key={cert._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg"
                        onClick={() => setSelectedCert(cert)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-primary">{cert.category?.name}</h3>
                          <Badge variant="success">{cert.grade}</Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                          Issued to: {cert.intern?.firstName} {cert.intern?.lastName}
                        </p>

                        <div className="space-y-2 mb-6 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Score:</span>
                            <span className="font-semibold text-primary">{cert.score}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completion:</span>
                            <span className="font-semibold text-primary">{cert.completionPercentage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Issued:</span>
                            <span className="font-semibold text-primary">
                              {new Date(cert.issueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadCertificate(cert);
                            }}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                          >
                            Verify
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
