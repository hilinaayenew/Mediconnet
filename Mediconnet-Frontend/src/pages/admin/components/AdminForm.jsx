"use client"

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { toast } from "react-toastify"
import { Save } from "lucide-react"

const AdminForm = ({ hospitalId, hospitalName, onAdminCreated, onFinish }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "Male",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "HospitalAdministrator",
    hospitalID: hospitalId,
  })
  const [errors, setErrors] = useState({
    dateOfBirth: "",
    passwordMismatch: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user changes the field
    setErrors((prev) => ({
      ...prev,
      [name === "dateOfBirth" ? "dateOfBirth" : "passwordMismatch"]: "",
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let hasErrors = false
    const newErrors = {
      dateOfBirth: "",
      passwordMismatch: "",
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMismatch = "Passwords do not match"
      hasErrors = true
    }

    // Validate age (must be at least 21 years old)
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required"
      hasErrors = true
    } else {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date("2025-06-06")
      const age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      const dayDiff = today.getDate() - dob.getDate()
      // Adjust age if birthday hasn't occurred this year
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
      if (adjustedAge < 21) {
        newErrors.dateOfBirth = "Administrator must be at least 21 years old"
        hasErrors = true
      }
    }

    setErrors(newErrors)

    if (hasErrors) {
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would send this data to your API
      console.log("Submitting admin data:", formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate a fake admin ID that would normally come from the database
      const newAdmin = {
        ...formData,
        id: `admin_${Date.now()}`, // This would normally come from the database
      }

      toast.success("Hospital administrator added successfully")
      onAdminCreated(newAdmin)

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        dateOfBirth: "",
        gender: "Male",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        role: "HospitalAdministrator",
        hospitalID: hospitalId,
      })
      setErrors({
        dateOfBirth: "",
        passwordMismatch: "",
      })
    } catch (error) {
      console.error("Error adding admin:", error)
      toast.error("Failed to add hospital administrator")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-medium">Add Administrator for {hospitalName}</h2>
        <p className="text-sm text-muted-foreground">Create an administrator account for this hospital</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.passwordMismatch && (
                <p className="text-sm text-red-500">{errors.passwordMismatch}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onFinish}>
            Skip & Finish
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Administrator"}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminForm